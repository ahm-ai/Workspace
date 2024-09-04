# Kill a specific session by name:
tmux kill-session -t session_name

# Kill all sessions except the current one:
 tmux kill-session -a

# List all sessions before killing:
# First, list the sessions:
tmux list-sessions

# kill server 
tmux kill-server



# apply config
tmux source-file ~/.tmux.conf