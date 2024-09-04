brew install iterm2  


brew install starship


echo 'eval "$(starship init zsh)"' >> ~/.zshrc && source ~/.zshrc



brew install --cask font-fira-code-nerd-font

brew install --cask font-hack-nerd-font


# Pure
starship preset pure-preset -o ~/.config/starship.toml

# Catpuccin
cp starship.toml ~/.config/starship.toml