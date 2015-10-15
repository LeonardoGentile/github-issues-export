Export github issues to CSV file
--------------------------------

A simple script to free your github issues so you can import them into Excel etc.

The script is developed in NodeJS.

__Installation__
Clone the repo then `npm install`


__Usage__: 
```
node export-issues.js --user [github user] --password [github password] --owner [github owner of repo] --repo [github repo] --state [issues state (optional, "open", "closed", "all", default=open)] --bodynewlines [include newlines in body (y/n, default=y)] --full [include issue body or not (if omitted then no issue body included)]'

# to print to a file:
node export-issues.js --user [github user] --password [github password] --owner jquery --repo jquery --state "open" --bodynewlines n  --full false &>issues.csv
```


__NOTE__
You need to delete the auth token from github everytime you lunch the script, @TOFIX

__TODO__:
- find a better way to authenticate (github auth api changed)
- limit to specific date range
- exclude pull request from the isssues