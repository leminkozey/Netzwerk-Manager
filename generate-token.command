#!/bin/zsh
# Einfache Token-Generierung: gibt eine UUID aus, die du in Data/LoginToken.txt eintragen kannst.

node -e "console.log(require('crypto').randomUUID())"
