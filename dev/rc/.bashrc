#!/bin/bash
parse_git_branch() {
  git branch 2>/dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(\1)/'
}
export PS1="$(echo -e '\U00002699') \w \[\e[94m\]\$(parse_git_branch)\[\e[00m\]\$ "

if [ -f $HOME/.git-completion ]; then
  . $HOME/.git-completion
fi

export PATH=$HOME/.local/bin:/src/node_modules/.bin:$PATH
