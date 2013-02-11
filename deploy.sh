#!/bin/sh
yeoman build
rm -rf dist/components
git add dist/
git commit -m "Build" dist/
./deploy.js production cb4bb36a1ad55df69ee1b0fcb1001934
git push heroku deploy:master --force
