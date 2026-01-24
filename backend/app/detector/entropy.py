import math
from collections import Counter

# 🧩 step 1: compute entropy of IP frequencies
def calculate_entropy(ip_list):
    if not ip_list:
        return 0.0

    freq = Counter(ip_list)
    total = sum(freq.values())

    entropy = 0.0
    for count in freq.values(): 
        p = count / total
        entropy -= p * math.log2(p)

    return round(entropy, 4)
