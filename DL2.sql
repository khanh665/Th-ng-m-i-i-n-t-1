select * from DonHang
select * from ChiTietDonHang
select * from SanPham
select * from NguoiDung

CREATE TABLE NguoiDung (
    MaNguoiDung INT PRIMARY KEY IDENTITY(1,1),
    HoTen NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    MatKhau VARCHAR(255) NOT NULL, -- Sẽ lưu mã hóa (Hash)
    SoDienThoai VARCHAR(15),
    VaiTro NVARCHAR(20) DEFAULT 'user', -- 'user' hoặc 'admin'
    NgayTao DATETIME DEFAULT GETDATE()
);

-- Tạo sẵn 1 tài khoản Admin để test
INSERT INTO NguoiDung (HoTen, Email, MatKhau, VaiTro) 
VALUES (N'Quản Trị Viên', 'admin@gmail.com', 'admin123', 'admin');