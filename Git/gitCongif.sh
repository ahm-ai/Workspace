

# Create function that creates new ssh  keys
ssh-keygen -t ed25519 -C "" 
/Users/home/.ssh/<NAME>

# COPY keys
cat $HOME/.ssh/<NAME>.pub | pbcopy

# Create function to use those ssh keys
 ssh-add ~/.ssh/<NAME>

