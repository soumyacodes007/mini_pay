#!/bin/bash

AADHAAR=$1

if [[ $AADHAAR =~ ^[0-9]{12}$ ]]; then
  echo "Aadhaar format valid"
else
  echo "Invalid Aadhaar format"
fi
