CREATE TABLE DanhMuc (
    MaDanhMuc INT IDENTITY(1,1) PRIMARY KEY,
    TenDanhMuc NVARCHAR(150),
    MaDanhMucCha INT NULL
);
-- DANH MỤC CHA
INSERT INTO DanhMuc VALUES (N'Rau củ', NULL);
INSERT INTO DanhMuc VALUES (N'Trái cây', NULL);
INSERT INTO DanhMuc VALUES (N'Nông sản khô', NULL);

-- DANH MỤC CON
INSERT INTO DanhMuc VALUES (N'Rau lá', 1);
INSERT INTO DanhMuc VALUES (N'Củ', 1);

INSERT INTO DanhMuc VALUES (N'Trái cây miền Bắc', 2);
INSERT INTO DanhMuc VALUES (N'Trái cây miền Nam', 2);

INSERT INTO DanhMuc VALUES (N'Gạo', 3);
INSERT INTO DanhMuc VALUES (N'Măng khô', 3);

ALTER TABLE SanPham ADD MaDanhMuc INT;
-- Thiết lập khóa ngoại để đảm bảo tính toàn vẹn
ALTER TABLE SanPham ADD CONSTRAINT FK_SanPham_DanhMuc 
FOREIGN KEY (MaDanhMuc) REFERENCES DanhMuc(MaDanhMuc);

SELECT * FROM DanhMuc;

SET IDENTITY_INSERT DanhMuc ON;
INSERT INTO DanhMuc (MaDanhMuc, TenDanhMuc, MaDanhMucCha) VALUES (10, N'Rau củ', NULL);
INSERT INTO DanhMuc (MaDanhMuc, TenDanhMuc, MaDanhMucCha) VALUES (11, N'Trái cây', NULL);
INSERT INTO DanhMuc (MaDanhMuc, TenDanhMuc, MaDanhMucCha) VALUES (12, N'Nông sản khô', NULL);
SET IDENTITY_INSERT DanhMuc OFF;

UPDATE DanhMuc SET MaDanhMucCha = 10 WHERE MaDanhMuc IN (10); -- Rau lá, Củ thuộc Rau củ
UPDATE DanhMuc SET MaDanhMucCha = 11 WHERE MaDanhMuc IN (11); -- Trái cây miền Bắc/Nam thuộc Trái cây
UPDATE DanhMuc SET MaDanhMucCha = 12 WHERE MaDanhMuc IN (12); -- Gạo, Măng thuộc Nông sản khô

-- Đưa MaDanhMucCha của các nhóm gốc về NULL
UPDATE DanhMuc SET MaDanhMucCha = NULL WHERE MaDanhMuc IN (10, 11, 12);
-- Đưa MaDanhMucCha của các nhóm gốc về NULL
UPDATE DanhMuc SET MaDanhMucCha = NULL WHERE MaDanhMuc IN (10, 11, 12);
		SELECT * FROM SanPham;
		SELECT * FROM NguoiDung;

		SELECT * FROM DonHang;
		SELECT * FROM ChiTietDonHang

		DELETE FROM DonHang;
		DELETE FROM ChiTietDonHang;
		DBCC CHECKIDENT ('DonHang', RESEED, 999);
		SELECT * FROM DanhMuc;
		SELECT MaSanPham, TenSanPham, MaDanhMuc FROM SanPham;
		

-- Ví dụ: Gán sản phẩm 'Bắp cải' (ID 1) vào danh mục 'Rau lá' (ID 1)
UPDATE SanPham SET MaDanhMuc = 6 WHERE MaSanPham = 4;

-- Ví dụ: Gán 'Cam' vào danh mục 'Trái cây miền Bắc' (ID 3)
UPDATE SanPham SET MaDanhMuc = 3 WHERE MaSanPham = 5;
UPDATE DanhMuc SET MaDanhMucCha = 11 WHERE MaDanhMuc IN (3, 4); -- 3 và 4 là các loại trái cây con

UPDATE DanhMuc Set TenDanhMuc = N'Thịt trâu' where MaDanhMuc = 6
UPDATE DanhMuc Set MaDanhMucCha = 12 where MaDanhMuc = 6

USE QuanLyBanHang;
GRANT INSERT, UPDATE, DELETE TO QuanLy1;
