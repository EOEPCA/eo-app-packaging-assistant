# this package will be installed through a requirements.txt file
import numpy as np

# this package will be installed as a software package through the build options interface.
from flask import Flask

import sys

print("Testing Numpy Container")
amount = sys.argv[1]
print(f"Found amount {amount}")
data = np.zeros(int(amount))
print(data)
