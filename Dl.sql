

-- 1. Bảng SanPham (Quản lý kho)
CREATE TABLE SanPham (
    MaSanPham INT PRIMARY KEY,
    TenSanPham NVARCHAR(200),
    GiaBan DECIMAL(18, 2),
    TonKho INT, 
    LinkAnh NVARCHAR(500),
    PhanLoai NVARCHAR(MAX) -- Lưu chuỗi: "Size L, Size M..."
);

-- 2. Bảng DonHang (Lưu thông tin khách và đơn hàng)
CREATE TABLE DonHang (
    MaDonHang INT IDENTITY(1,1) PRIMARY KEY,
    TenKhachHang NVARCHAR(200),
    SoDienThoai VARCHAR(20),
    DiaChi NVARCHAR(500),
    TongTien DECIMAL(18, 2),
    NgayDat DATETIME DEFAULT GETDATE()
);

-- Chèn dữ liệu mẫu tiếng Việt
INSERT INTO SanPham VALUES (1, N'Cà Phê Arabica Sơn La', 250000, 50, 'images/ca-phe.jpg', N'Gói 500g, Hạt rang');
INSERT INTO SanPham VALUES (2, N'Mận Hậu Mộc Châu', 100000, 100, 'images/man-hau.jpg', N'Size VIP, Size Thường');