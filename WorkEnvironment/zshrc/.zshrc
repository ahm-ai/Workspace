# INSTALL PLUGINS
# git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# git clone https://github.com/zsh-users/zsh-completions ${ZSH_CUSTOM:=~/.oh-my-zsh/custom}/plugins/zsh-completions

# git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

#  https://dh4ihowhowe4s.cloudfront.net

source ~/.ffmpegCommands
source ~/.ASCII_colors

# Catppuccin
export FZF_DEFAULT_OPTS='--color=bg+:#313244,bg:#1e1e2e,spinner:#f5e0dc,hl:#f38ba8 --color=fg:#cdd6f4,header:#f38ba8,info:#cba6f7,pointer:#f5e0dc --color=marker:#f5e0dc,fg+:#cdd6f4,prompt:#cba6f7,hl+:#f38ba8'

#  KILL PORTS
function killPort {
  kill $(lsof -t -i:$1)
}

function getPluginsZsh {
  brew install zsh-completions
  brew install zsh-autosuggestions
  brew install zsh-syntax-highlighting
}

plugins=(
  git
  zsh-autosuggestions
  zsh-syntax-highlighting
)

function runTest {
  # git status -s | grep ".tsx\|.ts\|.js" | sed "s/\M//" | xargs yarn react-scripts test --
  git status -s | grep ".tsx\|.ts\|.js" | sed "s/\M//" | xargs npm run test --
}

function format {
  git status -s | grep ".tsx\|.ts\|.js" | sed "s/\M//" | sed "s/\??//" | sed "s/\A//" | xargs npx prettier --write
}

function formatR {
  npx prettier --write "$1/**/*.{js,jsx,json,ts,tsx}"
}

function cleanStaleBranches {
  git fetch --all --prune
  git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D
  git branch --merged | grep -v \* | xargs !git branch -D
}

function checkShaSum {
  shasum -a 256 $1
}
