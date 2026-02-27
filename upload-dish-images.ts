import { S3Storage } from "coze-coding-dev-sdk";

// 初始化存储
const storage = new S3Storage({
  region: "cn-beijing",
});

// 菜品图片URL列表（按顺序对应49道菜）
const dishImages = [
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_b516e9b6-f325-4842-8eba-adb85da4c289.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_0d4e1c2e-2df0-40dd-a321-5de9dd23dcb6.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_9b429056-eec8-48ab-b3ed-a3b5d86a32c4.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_7bec6324-e457-4a97-a79f-40381bd90be0.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_34266add-d32d-4c05-a6ca-77ac8a03f899.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_58171df0-4a66-4c5c-910a-06e083c8b92b.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_d81aa226-2565-4d17-837d-d5626de0286b.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_2d34bbe6-0a9d-4945-ad80-f97c569444bd.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_525bcbf9-23f4-4060-8bb1-e10163a45505.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_8be4ad2a-7c6a-4b08-b70a-8687a932c4ba.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_2b15f016-3ec0-4898-9283-66108d23d4a1.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_baaa1855-c7cc-4cf9-9ea7-f819aac62273.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_6deb0ef8-3fdd-486b-a321-0a8241e0131c.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_3046eef8-d05b-4e3f-9329-309e7ebe1b3b.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_bf95de4e-ef88-4bdb-aae7-95c1a8bb7a13.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_dfd92904-329f-4824-954f-c6c9be4b527a.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_3fc68cc6-e36b-4245-8e9f-00970a224577.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_1e188d81-5b2a-4b84-aec9-22b8ff62b870.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_b7daa38f-b868-414c-aa33-aa8666fd6d6f.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_b86f34a7-bb33-4da6-a971-dbb9a0013da6.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_82e9f29f-9f7f-4ca7-a5a2-a5a4aa1f3c75.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_346cf800-4b94-433e-b23f-1248c30c2c86.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_1d60c64f-e8b6-4110-8000-7d2e14961455.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_439269ea-9cb2-44f8-a030-e61745547633.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_194b7ad3-275a-400e-ac8c-246bdee104ef.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_7ad9af4a-f560-44fe-806a-d3d36e1a8249.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_7aed41ee-926f-45a1-865f-3fb0ea831ede.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_6e1fc1c5-d916-456a-9843-d5b82ed8cc44.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_c1365641-5db9-4b16-bec3-f24e01dffa7c.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_1d883731-125e-48cd-b3a3-f3f5e20fc6f9.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_e5aeff0a-43e9-443a-ac9a-67a517be05d1.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_0ed3bd9e-3522-43ac-9864-c0db810b1922.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_ab9c473c-653f-474a-9dc5-a6c7a4f189ef.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_6ec5f02c-dc5c-4c0d-ba5b-a9a4b8dafcb2.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_afba3314-a100-4213-b4f2-3c2bbac56bf0.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_cfec2033-4b7f-4af8-bdbd-36851fa0d4d9.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_69d1a692-f829-4919-a472-b15135a8e316.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_c9ac6748-8008-4d32-aafe-51e97dfd252b.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_51abe8b9-7475-40f5-baf3-02bbe578e9e5.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_834044b1-98c5-4882-b9e3-3db72507af15.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_7639291f-28c1-4cf7-bd53-950fec30eb39.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_9588a453-186b-4d61-acce-f9a46e9d6703.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_a9378514-e707-4f9c-a185-9e7ea5d3f929.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_9918dfae-d4a4-44cb-b272-40a0173ef9a9.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_68f1bc8d-dcc7-4f28-b6ad-3b3cdad334b7.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_e9e04331-733c-4505-bb99-5f5fcfcf6630.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_1cdca400-d481-48d0-b8f1-f4571eebc592.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_2623b92e-6cad-410a-9dd7-96079ece4db9.jpeg",
  "https://coze-coding-project.tos.coze.site/coze_storage_7609703503665397796/image/generate_image_53908e7a-8b7f-43dd-9bce-7097a3855df2.jpeg",
];

async function uploadImages() {
  console.log("开始上传49张菜品图片...\n");
  const uploadedKeys = [];

  for (let i = 0; i < dishImages.length; i++) {
    const url = dishImages[i];
    const dishNumber = i + 1;

    try {
      console.log(`[${dishNumber}/49] 正在上传第${dishNumber}张图片...`);

      const key = await storage.uploadFromUrl({
        url: url,
        timeout: 60000,
      });

      console.log(`[${dishNumber}/49] ✓ 上传成功: ${key}`);
      uploadedKeys.push(key);

      if (i < dishImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`[${dishNumber}/49] ✗ 上传失败:`, (error as Error).message);
      uploadedKeys.push(null);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("上传完成！");
  console.log("=".repeat(50) + "\n");
  console.log("生成的Keys：");
  uploadedKeys.forEach((key, index) => {
    console.log(`${index + 1}. ${key}`);
  });

  // 保存到文件
  const fs = require("fs");
  const path = require("path");

  const outputPath = path.join(process.cwd(), "uploaded-image-keys.json");
  fs.writeFileSync(outputPath, JSON.stringify(uploadedKeys, null, 2));
  console.log(`\n✓ Keys已保存到: ${outputPath}`);
}

uploadImages().catch(console.error);
