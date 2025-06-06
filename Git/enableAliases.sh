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

# Reset the current branch and clean untracked files
git config --global alias.rs "!git reset --hard"

# Reset the current branch and clean untracked files
git config --global alias.cleanup '!git reset --hard && git clean -fd'

# Push the current branch to a specified branch on origin
git config --global alias.pushToBranch '!f() { branch=$1; git push origin $(git branch --show-current):$branch --no-verify -f; }; f'

# Revert a file to the state of a different branch
git config --global alias.revertFromBranch '!f() { git checkout $(git branch --show-current) -- "$1"; }; f'

# Delete all branches except the current one and main
git config --global alias.purgeExcept "!f() { git branch | grep -v \"^*\" | grep -v \"^\\s*main\\b\" | grep -v \"^\\s*_workspace\" | xargs git branch -D; }; f"

# Undo the last commit but keep changes in the working directory
git config --global alias.undo "!git reset HEAD~1 --mixed"

# Stash changes while keeping the index intact
git config --global alias.stash-ki "!git stash --keep-index"

# Stash unstaged changes, including untracked files
git config --global alias.stashAll '!f() { git stash save --include-untracked --keep-index "$@"; }; f'

# Show the last 10 commits in a graph format
git config --global alias.cms "!git --no-pager log -10 --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --date=relative"

# Show the last 30 commits in a graph format
git config --global alias.cml "!git --no-pager log --graph --pretty=format:'%C(magenta)%h%Creset -%C(red)%d%Creset %s %C(green)(%cr) [%an]' --abbrev-commit -30"

# Checkout a branch selected from a fuzzy search
git config --global alias.cob '!f() { selected_branch=$(git branch | fzf --ansi --preview '\''git diff --name-only $(sed s/^..// <<< {}) main | sed "s/^/  /" && echo "\\nLog:\\n" && git log --oneline --graph --date=short --pretty=format:"%C(auto)%cd %h%d %s" $(sed s/^..// <<< {})'\''); selected_branch=$(echo $selected_branch | sed '\''s/.* //'\''); git checkout $selected_branch; }; f'

# List all defined aliases
git config --global alias.alias "! git config --get-regexp ^alias\. | sed -e s/^alias\.// -e s/\ /\ =\ /"

# Stash modified and untracked files using fuzzy search
git config --global alias.fzf-stash '!f() { git ls-files -m -o --exclude-standard | fzf -m --print0 | xargs -0 -r git stash push -u --; }; f'

# Show differences between the current branch and a target branch using fuzzy search
git config --global alias.fzf-diff '!f() { target_branch=$1; git diff --name-only $target_branch...HEAD | fzf --preview "git diff $target_branch...HEAD --color=always -- {}"; }; f'

# List all aliases and allow selection to run
git config --global alias.aliases '!f() { 
    selected=$(git config --get-regexp ^alias\. | sed -e "s/^alias\.//" -e "s/\ /\ =\ /" | 
        fzf --height 100% --preview "git config --global --get alias.{1}" --preview-window right:70%:wrap | 
        cut -d" " -f1)
    if [ -n "$selected" ]; then
        echo "Running: git $selected"
        git $selected
    else
        echo "No alias selected"
    fi
}; f'

# Create a diff file between the current branch and a specified branch
git config --global alias.branchdiff '!f() { git diff $1 $(git branch --show-current) > branch_diff.txt; }; f'

echo "🚀 Aliases enabled"
