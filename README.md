Export github issues to CSV file
--------------------------------

A simple script to free your github issues so you can import them into Excel etc.

The script is developed in NodeJS.

### Installation
Clone the repo then `npm install`


### Usage: 

#### Obtain an auth token
This script is intended to fetch issues from private repos, so it needs an aunthentication mechanism. The simple user/pass authentication was removed due to incompatibilities with the new github API (todo next).  
In order to be authorized to access a private repo (that you have right to) you need to generate an access token to use with this script. Follow this step to obtain one:
  
  - Login into your github
  - Edit Profile 
  - Personal Access Token 
  - Generate New Token 
  - Check All 'Repo' permissions 
  - Generate Token 
  - Copy the generated token! This will be hidden as soon as you close the page and you need to re-issue another token if you forgot to copy this one.  

#### Run the script
Now, open the terminal and cd into the repo, then:

```
node export-issues.js --token yourTokenHere --owner RepoOwner --repo RepoName --state "closed" --bodynewlines n --body y 
```

This will retrieve all the issues (body included) from `http://github.com/RepoOwner/Reponame/issues` marked as `closed`, removing the `\n` or `\r` character from the body description of the issue and print the result as csv to the stdout.

In order to save the result to a __file__ you can do:
```
node export-issues.js --token yourTokenHere --owner RepoOwner --repo RepoName --state "closed" --bodynewlines n --body y &>closed_issues.csv
```


#### OPTIONS

  - `--token`: the token obtained from you github profile page
  - `--owner`: the username of the owner of the repo you want to fetch the issues from
  - `--repo`: the name of the repository you want to fetch the issues from
  - `--state`: the state of the issues (`open`, `closed`, `all`)
  - `--bodynewlines`: [y/n]. If `y` it leaves the `\n` and `\r` chars in the body of the issue. If `n` removes them so that it can nicely fit in a single line.
  - `--body`: [y/n] whether or not include the full body description of the issues in the result
    

#### TODO:
- find a better way to authenticate (github auth api changed)
- limit to specific date range
- exclude pull request from the isssues (they have a `pull_request` key)
- add option to List all issues across owned and member repositories for the authenticated user (commented out in the code)