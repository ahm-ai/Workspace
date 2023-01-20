# cp -f aliases/.gitconfig ~/.gitconfig

git config --global alias.st status
git config --global alias.a add
git config --global alias.b branch
git config --global alias.c commit
git config --global alias.co checkout
git config --global alias.bl "show-branch --color --list"
git config --global alias.dfm "!git diff --name-status"
git config --global alias.df "!git diff --name-only HEAD~"
git config --global alias.cms "!git --no-pager log -10 --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --date=relative"
git config --global alias.cob "!git branch | fzf | xargs -o git checkout"
git config --global alias.sq "!git log -n 50 --pretty=format:'%h %s' --no-merges | fzf | cut -c -7 | xargs -o git commit --squash"
git config --global alias.rb "!git rebase -i --autosquash main"
git config --global alias.vw "!gh pr view --web"
git config --global alias.ci "!gh pr checks"

git config --global pager.diff false
git config --global rebase.autosquash true

git config --global alias.ls "log -1 HEAD --stat --no-pager"
git config --global alias.fff "difftool -t vimdiff -y"
git config --global alias.clean "reset --hard"
git config --global alias.cml "!git --no-pager log --graph --pretty=format:'%C(magenta)%h%Creset -%C(red)%d%Creset %s %C(green)(%cr) [%an]' --abbrev-commit -30"
git config --global alias.del "branch -D"
git config --global alias.undo "reset HEAD~1 --mixed"
git config --global alias.res "reset --hard"

echo "🚀 Aliases enabled"