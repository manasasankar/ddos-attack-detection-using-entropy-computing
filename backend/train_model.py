import kagglehub
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

# Step 1: Download dataset
path = kagglehub.dataset_download("aikenkazin/ddos-sdn-dataset")
print("✅ Dataset downloaded to:", path)

# Step 2: Load dataset (adjust filename if different)
df = df = pd.read_csv(f"{path}/dataset_sdn.csv")
print(df.columns)



print("Rows:", len(df))

# Step 3: Feature selection
features = [
    'pktcount', 'bytecount', 'dur', 'flows',
    'pktrate', 'tx_kbps', 'rx_kbps', 'tot_kbps'
]
target = 'label'


df = df[features + [target]]

# Step 4: Encode target (1 = Attack, 0 = Normal)
df[target] = df[target].apply(lambda x: 1 if "Attack" in str(x) else 0)

# Step 5: Split data
X_train, X_test, y_train, y_test = train_test_split(df[features], df[target], test_size=0.2, random_state=42)

# Step 6: Train RandomForest model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Step 7: Save model automatically
os.makedirs("model", exist_ok=True)
with open("model/ddos_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("✅ Model trained and saved as model/ddos_model.pkl")
