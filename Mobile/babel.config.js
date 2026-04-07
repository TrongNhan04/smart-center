module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Sửa lỗi import.meta bằng cách bật tính năng này
          unstable_transformImportMeta: true,
        },
      ],
    ],
  };
};