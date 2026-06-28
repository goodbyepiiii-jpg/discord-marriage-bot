# 💍 Discord Marriage Bot

Bot Discord mô phỏng hệ thống kết hôn, con cái và chăm sóc trẻ em trong server.

## ✨ Tính năng

- 💍 **Cầu hôn & kết hôn** giữa các thành viên (yêu cầu tương tác ≥5 lần)
- 🏠 **Phòng riêng** tự động tạo khi kết hôn
- 👶 **Hệ thống con cái** — sinh con, đặt tên, chăm sóc
- 🌱 **Tương lai của con** — chọn trường học, sở thích, nghề nghiệp
- 📊 **Trạng thái hôn nhân** theo thời gian thực

## 📋 Danh sách lệnh

| Lệnh | Mô tả |
|------|-------|
| `/propose @user` | 💍 Cầu hôn người dùng |
| `/accept_propose` | 💒 Chấp nhận lời cầu hôn |
| `/reject_propose` | 💔 Từ chối lời cầu hôn |
| `/marriage_status` | 💑 Xem trạng thái hôn nhân |
| `/divorce` | 💔 Ly hôn |
| `/rename_room [tên]` | 🏠 Đổi tên phòng riêng |
| `/children` | 👶 Xem thông tin con cái |
| `/name_child [tên]` | 📝 Đặt tên cho em bé |
| `/feed [tên_con]` | 🍼 Cho con ăn |
| `/sleep_baby` | 😴 Ru bé ngủ |
| `/comfort` | 🤗 Dỗ bé nín |
| `/play` | 🎮 Chơi với bé |
| `/heal` | 💊 Chăm sóc bé ốm |
| `/future [tên] [giai đoạn]` | 🌱 Quyết định tương lai của con |

## 🚀 Cài đặt & Deploy

### 1. Clone repo

```bash
git clone https://github.com/your-username/discord-marriage-bot.git
cd discord-marriage-bot
npm install
```

### 2. Tạo file `.env`

```bash
cp .env.example .env
```

Điền vào `.env`:
```
DISCORD_TOKEN=token_bot_của_bạn
DISCORD_CLIENT_ID=client_id_ứng_dụng
```

Lấy token tại: https://discord.com/developers/applications

### 3. Đăng ký Slash Commands

```bash
npm run deploy
```

### 4. Chạy bot

```bash
npm start
```

## ☁️ Deploy lên DisCloud

1. Nén toàn bộ thư mục (trừ `node_modules/`) thành file `.zip`
2. Vào [DisCloud](https://discloud.app) → Upload App
3. Thêm biến môi trường trong DisCloud:
   - `DISCORD_TOKEN`
   - `DISCORD_CLIENT_ID`
4. Deploy! Bot sẽ chạy 24/7 tự động

> **Lưu ý:** File `discloud.config` đã được cấu hình sẵn, không cần chỉnh sửa.

## ⚠️ Quyền bot cần có

- `Send Messages`
- `Manage Channels` (để tạo/xóa phòng riêng)
- `View Channel`
- `Read Message History`

## 📝 Ghi chú

- Dữ liệu hôn nhân lưu **trong RAM** — sẽ mất khi restart bot. Nếu cần lưu lâu dài, hãy tích hợp database.
- Bot cần được thêm vào server với đủ quyền trên.
