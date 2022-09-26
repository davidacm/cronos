call git checkout -b gh-pages
call npm run build
ren dist docs
call git add docs
call git commit -m "deploy for gh pages"
call git push --force --set-upstream origin gh-pages
call git checkout main
call git branch -d gh-pages
