#!/bin/bash

PUBLIC_PATH="$(readlink -f "$(dirname "$0")"/../public)"
cd "$PUBLIC_PATH"/tokens

function oops {
  echo "$@" >&2
  exit 1
}

function VALIDATE_MANIFEST_V0 {
  MANIFEST=$1
  # .type
  TYPE=$(jq -r .type "$MANIFEST")
  [[ "$TYPE" == "ERC20" || "$TYPE" == "NATIVE_COIN" ]] || oops "Unknown token type $TYPE"
  echo "Token type: $TYPE"
  # .svgIconPath
  SVG_ICON_PATH=$(jq -r .svgIconPath "$MANIFEST")
  [ -f "$PUBLIC_PATH/$SVG_ICON_PATH" ] || oops "SVG icon path is invalid: $SVG_ICON_PATH"
  echo "SVG icon path: $SVG_ICON_PATH"
  # .isSuperToken
  IS_SUPER_TOKEN=$(jq -r .isSuperToken "$MANIFEST")
  if [ "$IS_SUPER_TOKEN" == "true" ];then
    echo "It is a super token"
    # .superTokenType
    SUPER_TOKEN_TYPE=$(jq -r .superTokenType "$MANIFEST")
    if [ "$SUPER_TOKEN_TYPE" == "ERC20_WRAPPER" ];then
      echo "It is a erc20 wrapper super token"
    elif [ "$SUPER_TOKEN_TYPE" == "CUSTOM" ];then
      echo "It is a custom super token"
      # .superTokenCustomProperties
      SUPER_TOKEN_CUSTOM_PROPERTIES=$(jq -r ".superTokenCustomProperties|.[]" "$MANIFEST")
      for i in $SUPER_TOKEN_CUSTOM_PROPERTIES;do
        [ "$i" == "SETH" ] && echo "  - Using SETH contract" && continue
        oops "Unknown super token custom property: $i"
      done
    else
      oops "Unknown super token type $CUSTOM"
    fi
  elif [ "$IS_SUPER_TOKEN" == "false" ];then
    echo "It is not a super token"
  else
    oops "Unknown isSuperToken value: $IS_SUPER_TOKEN"
  fi
}

for i in *;do
  echo "Validating token manifest of $i ..."
  MANIFEST=$i/manifest.json
  VERSION=$(jq -r .version "$MANIFEST")
  if [ $VERSION == "2021-05-18" ];then
    VALIDATE_MANIFEST_V0 $MANIFEST
  else
    oops "Unknown manifest version $VERSION"
  fi
  echo "Token manifest of $i is valid."
  echo
done
