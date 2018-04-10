'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://thinkful-connie:password123@ds241019.mlab.com:41019/blog-app-mongoose-challenge';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-blog-app';
exports.PORT = process.env.PORT || 8080;
