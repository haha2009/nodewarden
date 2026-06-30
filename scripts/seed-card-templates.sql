-- Seed 4 card templates for login types
-- Run: wrangler d1 execute nodewarden-db --local --file scripts/seed-card-templates.sql
-- Run: wrangler d1 execute nodewarden-db --remote --file scripts/seed-card-templates.sql

INSERT OR REPLACE INTO card_templates (key, title, order_num, enabled, schema_json)
VALUES
(
  'password',
  '密码登录',
  0,
  1,
  '{"key":"password","title":"密码登录","description":"用户名和密码登录","fields":[{"key":"username","type":"text","label":"用户名","binding":"login.username"},{"key":"password","type":"password","label":"密码","binding":"login.password","features":["password-toggle","password-copy","password-generate"]},{"key":"totp","type":"text","label":"两步验证","binding":"login.totp","onChangeBehavior":"keep"}],"titleEditable":false}'
),
(
  'sms_code',
  '验证码登录',
  1,
  1,
  '{"key":"sms_code","title":"验证码登录","description":"手机号 + 验证码登录","fields":[{"key":"phoneNumber","type":"text","label":"手机号","binding":"login.phoneNumber","inputMode":"tel","onChangeBehavior":"clear"},{"key":"totp","type":"text","label":"两步验证","binding":"login.totp","onChangeBehavior":"keep"}],"titleEditable":false}'
),
(
  'qr_scan',
  '扫码登录',
  2,
  1,
  '{"key":"qr_scan","title":"扫码登录","description":"扫码授权登录","fields":[{"key":"platform","type":"select","label":"平台","binding":"login.thirdPartyPlatform","onChangeBehavior":"clear","options":[{"label":"微信","value":"wechat"},{"label":"QQ","value":"qq"},{"label":"微博","value":"weibo"}]},{"key":"account","type":"text","label":"关联账号","binding":"login.thirdPartyAccount","onChangeBehavior":"clear"},{"key":"totp","type":"text","label":"两步验证","binding":"login.totp","onChangeBehavior":"keep"}],"titleEditable":false}'
),
(
  'third_party',
  '第三方登录',
  3,
  1,
  '{"key":"third_party","title":"第三方登录","description":"OAuth 第三方授权登录","fields":[{"key":"platform","type":"select","label":"平台","binding":"login.thirdPartyPlatform","onChangeBehavior":"clear","options":[{"label":"Google","value":"google"},{"label":"Apple","value":"apple"},{"label":"Microsoft","value":"microsoft"},{"label":"Twitter/X","value":"twitter"},{"label":"Facebook","value":"facebook"},{"label":"GitHub","value":"github"},{"label":"Discord","value":"discord"},{"label":"Telegram","value":"telegram"},{"label":"微信","value":"wechat"},{"label":"QQ","value":"qq"},{"label":"微博","value":"weibo"}]},{"key":"totp","type":"text","label":"两步验证","binding":"login.totp","onChangeBehavior":"keep"}],"titleEditable":false}'
);
