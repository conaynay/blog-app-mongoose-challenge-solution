'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedPostData() {
  console.log('seeding post data');
  const seedData = [];
  for (let i=1; i<=10; i++) {
    seedData.push(generatePostData());
  }
  return BlogPost.insertMany(seedData);
}

function generatePostData() {
  return {
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    },
    content: faker.random.words(),
    title: faker.random.words(),
    created: faker.date.recent()
  };
}

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('Blog posts API resource', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL); 
  });
  beforeEach(function(){
    return seedPostData();
  });
  afterEach(function(){
    return tearDownDb();
  });
  after(function(){
    return closeServer();
  });

  describe('GET endpoint', function(){
    it('should return all existing posts', function(){
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res){
          res = _res;
          expect(res).to.have.status(200);
          console.info(res.body);
          expect(res.body).to.have.length.of.at.least(1);
          return BlogPost.count();
        })
        .then(function(count){
          expect(res.body).to.have.length.of(count);
        });
    });

    it('should return posts with the right fields', function(){
      let resPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          console.info(res.body);
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length.of.at.least('1');

          res.body.forEach(function(blogs){
            expect(blogs).to.be.a('object');
            expect(blogs).to.include.keys(
              'id', 'author', 'content', 'title', 'created'
            );
          });
          resPost = res.body[0];
          return BlogPost.findById(resPost.id);
        })
        .then(function(blog){
          expect(resPost.id).to.equal(blog.id);
          expect(resPost.author).to.equal(blog.authorName);
          expect(resPost.content).to.equal(blog.content);
          expect(resPost.title).to.equal(blog.title);
        });
    }); //it
  }); //describe get endpoint

  describe('POST endpoint', function(){
    it('should add a new post',function(){
      const newPost = generatePostData();

      return chai.request(app)
        .post('/posts')
        .send(newPost)
        .then(function(res){
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'author', 'content', 'title', 'created');
          expect(res.body.name).to.equal(newPost.name);
          expect(res.body.id).to.not.be.null;
          expect(res.body.content).to.equal(newPost.content);
          return BlogPost.findById(res.body.id);
        })
        .then(function(blog){
          expect(blog.author.firstName).to.equal(newPost.author.firstName);
          expect(blog.author.lastName).to.equal(newPost.author.lastName);
          expect(blog.title).to.equal(newPost.title);
          expect(blog.content).to.equal(newPost.content);
        });
    });
  });

  describe('PUT endpoint', function(){
    it('should update fields you send over', function(){
      const updateData = {
        title: 'Thie history of everything',
        content: 'It existed. It still exists.'
      };

      return BlogPost
        .findOne()
        .then(function(blog){
          console.info(blog);
          updateData.id = blog.id;
          return chai.request(app)
            .put(`/posts/${blog.id}`)
            .send(updateData);
        })
        .then(function(res){
          expect(res).to.have.status(204);
          return BlogPost.findById(updateData.id);
        })
        .then(function(blog){
          expect(blog.title).to.equal(updateData.title);
          expect(blog.content).to.equal(updateData.content);
        });
    });
  });

  describe('DELETE endpoint', function(){
    it('should delete a post by id', function(){
      let blog;

      return BlogPost
        .findOne()
        .then(function(_blog){
          blog = _blog;
          return chai.request(app).delete(`/posts/${blog.id}`);
        })
        .then(function(res){
          expect(res).to.have.status(204);
          return BlogPost.findById(blog.id);
        })
        .then(function(_blog){
          expect(_blog).to.be.null;
        });
    });
  });

}); //describe api
