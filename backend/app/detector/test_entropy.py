from entropy import calculate_entropy

ip_data = ["192.168.1.2", "192.168.1.3", "192.168.1.3", "192.168.1.3"]
print("Entropy:", calculate_entropy(ip_data))
