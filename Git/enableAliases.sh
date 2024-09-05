#!/bin/bash
git config --global filter.lfs.process "git-lfs filter-process"
git config --global filter.lfs.required true
git config --global filter.lfs.clean "git-lfs clean -- %f"
git config --global filter.lfs.smudge "git-lfs smudge -- %f"

# Pull and push configurations
git config --global pull.rebase true
git config --global pull.ff only
git config --global --add --bool push.autoSetupRemote true

# Color configurations
git config --global color.ui auto
git config --global color.branch.current "yellow reverse"
git config --global color.branch.local "yellow"
git config --global color.branch.remote "green"
git config --global color.diff.meta "yellow bold"
git config --global color.diff.frag "magenta bold"
git config --global color.diff.old "red bold"
git config --global color.diff.new "green bold"

git config --global color.status.added "yellow"
git config --global color.status.changed "green"
git config --global color.status.untracked "cyan"

# Default aliases
git config --global alias.st status
git config --global alias.a add
git config --global alias.b branch
git config --global alias.c commit
git config --global alias.co checkout

# Custom aliases
git config --global alias.rs "!git reset --hard"
git config --global alias.cleanup '!git reset --hard && git clean -fd'
git config --global alias.pushToBranch '!f() { branch=$1; git push origin $(git branch --show-current):$branch --no-verify -f; }; f'
git config --global alias.revert-to-main '!f() { git checkout main -- "$1"; }; f'
git config --global alias.purgeExcept "!f() { git branch | grep -v \"^*\" | grep -v \"^\\s*main\\b\" | grep -v \"^\\s*_workspace\" | xargs git branch -D; }; f"
git config --global alias.undo "!git reset HEAD~1 --mixed"
git config --global alias.stash-ki "!git stash --keep-index"
git config --global alias.stash-unstaged '!f() { git stash save --include-untracked --keep-index "$@"; }; f'
git config --global alias.cms "!git --no-pager log -10 --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --date=relative"
git config --global alias.cml "!git --no-pager log --graph --pretty=format:'%C(magenta)%h%Creset -%C(red)%d%Creset %s %C(green)(%cr) [%an]' --abbrev-commit -30"
git config --global alias.cob '!f() { selected_branch=$(git branch | fzf --ansi --preview '\''git diff --name-only $(sed s/^..// <<< {}) main | sed "s/^/  /" && echo "\\nLog:\\n" && git log --oneline --graph --date=short --pretty=format:"%C(auto)%cd %h%d %s" $(sed s/^..// <<< {})'\''); selected_branch=$(echo $selected_branch | sed '\''s/.* //'\''); git checkout $selected_branch; }; f'
git config --global alias.alias "! git config --get-regexp ^alias\. | sed -e s/^alias\.// -e s/\ /\ =\ /"
git config --global alias.copy-folder '!f() { git checkout $1 -- $2 && git reset; }; f'
git config --global alias.unstage 'restore --staged'

echo "🚀 Aliases enabled"