import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from scipy.cluster.hierarchy import linkage, fcluster, dendrogram

# 讀取 CSV
df = pd.read_csv("資料_持續績優模組(Final)_新MBIT.csv")  # 改成你的檔名
features = ["E/I", "S/N", "T/F", "J/P"]
data = df[features].values

# 標準化
scaler = StandardScaler()
data_scaled = scaler.fit_transform(data)

# 階層聚類
Z = linkage(data_scaled, method='ward')

# 畫樹狀圖 (不顯示最下方文字)
plt.figure(figsize=(8,4))
dendrogram(
    Z,
    no_labels=True,       # 去掉樣本文字
    color_threshold=None  # 不自動上色
)
plt.title("Dendrogram")
plt.xlabel("")
plt.ylabel("Distance")
plt.show()

# 切樹取得三群
labels = fcluster(Z, t=3, criterion='maxclust')

# PCA 可視化
pca = PCA(n_components=2)
reduced = pca.fit_transform(data_scaled)

plt.figure(figsize=(6,6))
plt.scatter(reduced[:,0], reduced[:,1], c=labels, cmap="viridis", s=100, alpha=0.6)
plt.xlabel("PC1")
plt.ylabel("PC2")
plt.title("Hierarchical Clustering with PCA (3 clusters)")
plt.show()