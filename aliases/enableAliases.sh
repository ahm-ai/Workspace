git config --global filter.lfs.process "git-lfs filter-process"
git config --global filter.lfs.required true
git config --global filter.lfs.clean "git-lfs clean -- %f"
git config --global filter.lfs.smudge "git-lfs smudge -- %f"

git config --global pull.rebase true
git config --global pull.ff only

git config --global color.ui auto
git config --global color.branch.current "yellow reverse"
git config --global color.branch.local "yellow"
git config --global color.branch.remote "green"
git config --global color.diff.meta "yellow bold"
git config --global color.diff.frag "magenta bold"
git config --global color.diff.old "red bold"
git config --global color.diff.new "green bold"
git config --global diff.colorMoved zebra

git config --global color.status.added "yellow"
git config --global color.status.changed "green"
git config --global color.status.untracked "cyan"

# Default Utils
git config --global alias.st status
git config --global alias.a add
git config --global alias.b branch
git config --global alias.c commit
git config --global alias.co checkout

# Custom Utils
git config --global alias.del "branch -D"
git config --global alias.bl "show-branch --color --list"
git config --global alias.clean "!git reset --hard"
git config --global alias.undo "!git reset HEAD~1 --mixed"

# Stash only changes no staged files
git config --global alias.stash-c "!git stash --keep-index"


# Diffing
git config --global alias.df "!git diff --name-only $1"
git config --global alias.dfp "!git diff --name-only HEAD~"
git config --global alias.fff "difftool -t vimdiff -y"

# Listing
git config --global alias.cms "!git --no-pager log -10 --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --date=relative"
git config --global alias.cml "!git --no-pager log --graph --pretty=format:'%C(magenta)%h%Creset -%C(red)%d%Creset %s %C(green)(%cr) [%an]' --abbrev-commit -30"

# Using FZF
git config --global alias.cob "!git branch | fzf | xargs -o git checkout"
git config --global alias.sq "!git log -n 50 --pretty=format:'%h %s' --no-merges | fzf | cut -c -7 | xargs -o git commit --squash"

# Git CLI
git config --global alias.vw "!gh pr view --web"
git config --global alias.ci "!gh pr checks"

# Experimental
git config --global alias.rb "!git rebase -i --autosquash main"
git config --global alias.ls "log -1 HEAD --stat --no-pager"



echo "🚀 Aliases enabled"

