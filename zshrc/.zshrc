
# INSTALL PLUGINS 
# git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# git clone https://github.com/zsh-users/zsh-completions ${ZSH_CUSTOM:=~/.oh-my-zsh/custom}/plugins/zsh-completions

# git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

#  https://dh4ihowhowe4s.cloudfront.net

source ~/.ffmpegCommands 
source ~/.ASCII_colors 

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




