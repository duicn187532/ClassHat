import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score
from matplotlib import rcParams

# 中文字型
rcParams['font.family'] = 'AppleGothic'

# =====================
# 1. 讀取資料
# =====================
df = pd.read_csv("test1.csv")
features = ["E/I", "S/N", "T/F", "J/P"]
data = df[features].values

# 標準化
scaler = StandardScaler()
data_scaled = scaler.fit_transform(data)

# =====================
# 2. PCA 降到 2 維
# =====================
pca = PCA(n_components=2)
reduced = pca.fit_transform(data_scaled)

# =====================
# 3. 取得既有職類群
# =====================
group_labels = df["2022職類"]
unique_groups = group_labels.unique()
centroids_2d = np.array([reduced[group_labels==g].mean(axis=0) for g in unique_groups])

# =====================
# 4. KMeans 分群
# =====================
kmeans = KMeans(n_clusters=len(unique_groups), random_state=0)
kmeans_labels = kmeans.fit_predict(data_scaled)
kmeans_centroids_2d = np.array([reduced[kmeans_labels==i].mean(axis=0) for i in range(len(unique_groups))])

# 計算 ARI
ari = adjusted_rand_score(group_labels, kmeans_labels)
print(f"Adjusted Rand Index (職類 vs KMeans): {ari:.3f}")

# =====================
# 5. 新資料點
# =====================
new_data = np.array([[0.85, 0.42, 0.72, 0.95]])  # 新資料
new_data_scaled = scaler.transform(new_data)
new_reduced = pca.transform(new_data_scaled)

# =====================
# 6. 顏色設定
# =====================
colors = ['#3c3c8e', '#cb0d12', '#ff9501']      # 原資料三群顏色
kmeans_colors = ['#9467bd', '#8c564b', '#e377c2']  # KMeans 顏色
new_color = '#00bf63'                             # 新資料顏色

# =====================
# 7. 畫圖
# =====================
plt.figure(figsize=(16,8))

# ---- 左圖：職類群 ----
plt.subplot(1,2,1)
for i, group in enumerate(unique_groups):
    idx = group_labels == group
    plt.scatter(reduced[idx,0], reduced[idx,1], s=100, alpha=0.6, label=group, color=colors[i % len(colors)])
# 群平均點
plt.scatter(centroids_2d[:,0], centroids_2d[:,1], c='black', s=200, marker='X', label="群中心")
# 標群名稱
for i, group in enumerate(unique_groups):
    plt.text(centroids_2d[i,0]+0.05, centroids_2d[i,1]+0.05, group, fontsize=12, fontweight='bold')
# 三角形（只在三群時）
if len(unique_groups) == 3:
    plt.plot(np.append(centroids_2d[:,0], centroids_2d[0,0]),
             np.append(centroids_2d[:,1], centroids_2d[0,1]),
             c='black', linestyle='-', linewidth=2)
# 新資料點 + 虛線距離
plt.scatter(new_reduced[:,0], new_reduced[:,1], c=new_color, s=150, marker='o', label="新資料點")
for centroid in centroids_2d:
    plt.plot([new_reduced[0,0], centroid[0]], [new_reduced[0,1], centroid[1]], c=new_color, linestyle='--')
plt.title("職類群 + 新資料點")
plt.xlabel("PC1")
plt.ylabel("PC2")
plt.legend()
plt.grid(True)

# ---- 右圖：KMeans 分群 ----
plt.subplot(1,2,2)
for i in range(len(unique_groups)):
    idx = kmeans_labels == i
    plt.scatter(reduced[idx,0], reduced[idx,1], s=100, alpha=0.6, label=f"Cluster {i}", color=kmeans_colors[i % len(kmeans_colors)])
# KMeans 平均點
plt.scatter(kmeans_centroids_2d[:,0], kmeans_centroids_2d[:,1], c='black', s=200, marker='X', label="Cluster Center")
# 標群名稱 (Cluster 0/1/2)
for i in range(len(unique_groups)):
    plt.text(kmeans_centroids_2d[i,0]+0.05, kmeans_centroids_2d[i,1]+0.05, f"C{i}", fontsize=12, fontweight='bold')
# 三角形
if len(unique_groups) == 3:
    plt.plot(np.append(kmeans_centroids_2d[:,0], kmeans_centroids_2d[0,0]),
             np.append(kmeans_centroids_2d[:,1], kmeans_centroids_2d[0,1]),
             c='black', linestyle='-', linewidth=2)
# 新資料點 + 虛線距離
plt.scatter(new_reduced[:,0], new_reduced[:,1], c=new_color, s=150, marker='o', label="新資料點")
for centroid in kmeans_centroids_2d:
    plt.plot([new_reduced[0,0], centroid[0]], [new_reduced[0,1], centroid[1]], c=new_color, linestyle='--')
plt.title("KMeans 分群 + 新資料點")
plt.xlabel("PC1")
plt.ylabel("PC2")
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.show()
