const express = require('express');
const app = express();
const { engine } = require('express-handlebars');
const path = require('path');
const { connectDB, getClockInDB, clockIn} = require('./db'); // Import từ db.js
const port = 3000;

// Cấu hình middleware để parse request body
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body (cho form HTML)

app.engine('hbs', engine({
  extname: '.hbs',
  helpers: {
    formatDate: function (date) {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0, nên cộng thêm 1
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    },
  },
}));app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

connectDB()

// index.js
app.get('/', async (req, res) => {
  let employeeID = null; // Khởi tạo employeeID

  // Lấy employeeID từ query string (nếu có)
  if (req.query.id !== undefined) {
    employeeID = parseInt(req.query.id); // Chuyển id thành số nguyên
    if (isNaN(employeeID)) {
      return res.status(400).json({ message: 'EmployeeID không hợp lệ' });
    }
  }

  try {
    // Lấy bản ghi chấm công theo employeeID (hoặc tất cả nếu employeeID là null)
    const clockInRecords = await getClockInDB(employeeID);
    res.render('home', { clockInRecords }); // Truyền dữ liệu vào template
  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu chấm công:', err);
    res.render('home'); // Trả về mảng rỗng nếu có lỗi
  }
});

app.post('/clockIn', async(req, res) =>{
  console.log("✅ Nhận POST: ", req.body);
  try {
    const { employeeID } = req.body; // Lấy employeeID từ request body
    if (!employeeID) {
      return res.status(400).json({ message: 'Vui lòng cung cấp EmployeeID' });
    }
    await clockIn(employeeID); // Gọi hàm clockIn
    res.redirect('/'); // Chuyển hướng về trang chủ
  } catch (err) {
    console.error('Lỗi khi chấm công:', err);
    res.status(500).json({ message: 'Lỗi khi chấm công, vui lòng thử lại' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log('Server is running on all interfaces');
});