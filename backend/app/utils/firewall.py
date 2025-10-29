import os

def block_ip(ip):
    os.system(f'netsh advfirewall firewall add rule name="Block_{ip}" dir=in action=block remoteip={ip}')
    print(f"🚫 Blocked IP: {ip}")

def unblock_ip(ip):
    os.system(f'netsh advfirewall firewall delete rule name="Block_{ip}"')
    print(f"✅ Unblocked IP: {ip}")
