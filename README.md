# Party Lines

**Needs our special blend of yeoman**

### Setup

*Make sure your cobbweb yeoman is up to date!*

1. `./install.sh`
2. `npm install`
3. `yeoman server`
4. Should have a server up n running on port 3501

### Deploy (tbc)

1. `git branch -D deploy` Force delete any existing deploy branch
2. `git checkout -b deploy` This is our throwaway branch
3. *CHECK YOUR .deployrc FILE!!!*
4. `yeoman build`
5. `rm -rf dist/components/` Usually we don't need this since it's all concatenated, speeds up deploys when we don't have this
6. `git add dist/`
7. `git commit -m "Build" dist/`
8. `./deploy.js production|staging RACKSPACE_API_KEY` Push files to Rackspace CloudFiles
9. Staging only: `git push heroku deploy:master --force` (not cached :D) Push to heroku
10. `git checkout master`
11. `git branch -D deploy`

### .deployrc File

Stores the cdnUrl that the build uses

```json
{
  "cdnUrl": "http://partylines-assets.theglobalmail.org/"
}
```

## TODO

* Handle multiple hansard loads coming in
* Handle too many results or 500 or 404
* Handle not reloading hansard if active blind has not changed
* Handle highlighting of hansard when non exact match is used
