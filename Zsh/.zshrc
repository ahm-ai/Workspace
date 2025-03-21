


ENABLE_CORRECTION="true"

plugins=( 
    git
    zsh-syntax-highlighting
    zsh-autosuggestions
    zsh-completions
)


source $ZSH/oh-my-zsh.sh

export GOPATH=$HOME/go

source ~/.torConfig
source ~/.youtubeConfig 
source ~/.ffmpegCommands 
source ~/.ASCII_colors 

# Utils

# Add a new SSH key to your GitHub account
function addSSH(){
    name=$1
    pbcopy < ~/.ssh/$name.pub
    ssh-add ~/.ssh/$name    
    echo "Copied to clipboard"
    echo "Add to Github"
}