const API_URL = 'https://nongsansonla.loca.lt'; // Thay đổi theo URL của bạn nếu cần


let currentProduct = null;

document.addEventListener('DOMContentLoaded', () => {
    taiSanPham();          // Tải sản phẩm
    taiDanhMucHienThi();   // Tải danh mục đa cấp
    capNhatIcon();         // Cập nhật số lượng giỏ hàng
    hienThiGioHang();      // Hiển thị nội dung giỏ
    updateAuthUI();        // Kiểm tra trạng thái đăng nhập
});

// --- QUẢN LÝ SẢN PHẨM ---
async function taiSanPham() {
    const list = document.getElementById('product-list');
    try {
        const res = await fetch(`${API_URL}/api/sanpham`);
        const data = await res.json();
        allProducts = data; 
        
        list.innerHTML = data.map(sp => {
            const isOutOfStock = sp.TonKho <= 0;
            const isLowStock = sp.TonKho > 0 && sp.TonKho <= 10; // Ngưỡng cảnh báo là 10

            return `
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}">
                <img src="${sp.LinkAnh || 'https://via.placeholder.com/200'}" alt="${sp.TenSanPham}" style="${isOutOfStock ? 'filter: grayscale(1);' : ''}">
                <h3>${sp.TenSanPham}</h3>
                
                <div class="stock-status-badge">
                    ${isOutOfStock ? '<span style="color:red; font-weight:bold;">Tạm hết hàng</span>' : 
                      isLowStock ? `<span style="color:#ff9800; font-size:12px;">🔥 Chỉ còn ${sp.TonKho} món</span>` : 
                      `<span style="color:#888; font-size:11px;">Còn lại: ${sp.TonKho}</span>`}
                </div>

                <p class="price">${Number(sp.GiaBan || 0).toLocaleString()} đ</p>
                <button class="btn-buy" ${isOutOfStock ? 'disabled' : ''} 
                    style="${isOutOfStock ? 'background:#ccc; cursor:not-allowed;' : ''}"
                    onclick="moModalDetail(${sp.MaSanPham})">
                    ${isOutOfStock ? 'HẾT HÀNG' : 'XEM CHI TIẾT'}
                </button>
            </div>`;
        }).join('');
    } catch (err) { console.error("Lỗi:", err); }
}

window.moModal = (id, name, price, img, stock) => {
    currentProduct = { id, name, price, img, stock };
    document.getElementById('detail-name').innerText = name;
    document.getElementById('detail-price').innerText = Number(price).toLocaleString() + ' đ';
    document.getElementById('detail-img').src = img;
    document.getElementById('detail-stock').innerText = stock + " sản phẩm";
    document.getElementById('buy-qty').value = 1;
    document.getElementById('product-detail-modal').style.display = 'flex';
};

window.changeQty = (val) => {
    const input = document.getElementById('buy-qty');
    let res = parseInt(input.value) + val;
    
    // Ngăn chặn mua quá số lượng trong kho
    if (currentProduct && res > currentProduct.TonKho) {
        alert(`Rất tiếc, kho chỉ còn ${currentProduct.TonKho} sản phẩm này!`);
        return;
    }
    if (res >= 1) input.value = res;
};

// --- QUẢN LÝ GIỎ HÀNG ---
document.getElementById('add-to-cart-final').onclick = () => {
    if (!currentProduct) return alert("Lỗi dữ liệu sản phẩm!");

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const qty = parseInt(document.getElementById('buy-qty').value);
    
    // Tìm kiếm bằng MaSanPham
    const existingItem = cart.find(item => item.MaSanPham === currentProduct.MaSanPham);
    
    if (existingItem) {
        existingItem.SoLuongThuc += qty;
    } else {
        // Thêm mới với tên thuộc tính đồng nhất
        cart.push({ 
            MaSanPham: currentProduct.MaSanPham,
            TenSanPham: currentProduct.TenSanPham,
            GiaBan: currentProduct.GiaBan,
            LinkAnh: currentProduct.LinkAnh,
            SoLuongThuc: qty 
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    capNhatIcon();
    hienThiGioHang();
    document.getElementById('product-detail-modal').style.display = 'none';
    toggleCart(); 
};
// DoAn.js - Cập nhật hàm hiển thị
function hienThiGioHang() {
    const list = document.getElementById('cart-items-list');
    const totalElement = document.getElementById('cart-total');
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:40px 20px;"><p>Giỏ hàng trống</p></div>`;
        totalElement.innerText = '0 đ';
        return;
    }

    let total = 0;
    list.innerHTML = cart.map((item, index) => {
        // Tính toán dựa trên thuộc tính mới
        const itemPrice = parseFloat(item.GiaBan || 0);
        const itemQty = parseInt(item.SoLuongThuc || 0);
        total += itemPrice * itemQty;

        return `
            <div class="cart-item" style="display:flex; align-items:center; gap:10px; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <img src="${item.LinkAnh}" width="50" style="border-radius:5px; object-fit:cover;">
                <div style="flex:1;">
                    <h4 style="font-size:14px; margin:0;">${item.TenSanPham}</h4>
                    <p style="margin:5px 0; color:#4CAF50;">${itemPrice.toLocaleString()}đ x ${itemQty}</p>
                </div>
                <button onclick="xoaItem(${index})" style="color:red; cursor:pointer; background:none; border:none;">&times;</button>
            </div>`;
    }).join('');
    totalElement.innerText = total.toLocaleString() + ' đ';
}

// Hàm kiểm tra trước khi đặt hàng (Quan trọng)
// Hàm kiểm tra trước khi đặt hàng
function checkCartBeforeCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Nếu giỏ hàng trống (độ dài mảng bằng 0)
    if (cart.length === 0) {
        alert("🛒 Vui lòng chọn sản phẩm trước khi đặt hàng!");
        return; // Dừng thực thi, không chuyển trang
    } 
    
    // Nếu có sản phẩm thì mới chuyển sang trang thanh toán
    window.location.href = 'checkout.html';
}


function toggleCart() {
    document.getElementById('quick-cart').classList.toggle('active');
    document.getElementById('cart-overlay').classList.toggle('active');
}

window.xoaItem = (index) => {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    hienThiGioHang();
    capNhatIcon();
};

function capNhatIcon() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const badge = document.getElementById('cart-count');
    if(badge) badge.innerText = cart.length;
}

// --- QUẢN LÝ ĐĂNG NHẬP / ĐĂNG KÝ ---
function toggleAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
}

function switchAuthMode(mode) {
    document.getElementById('form-login').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('form-reg').style.display = mode === 'reg' ? 'block' : 'none';
    document.getElementById('tab-login').className = mode === 'login' ? 'active' : '';
    document.getElementById('tab-reg').className = mode === 'reg' ? 'active' : '';
}

function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const authUI = document.getElementById('auth-ui');

    if (user) {
        // Khi đã đăng nhập: Chỉ hiện Icon, ấn vào Icon mới vào Profile
        authUI.innerHTML = `
            <div class="user-logged-in">
                <div class="profile-icon-btn" onclick="window.location.href='profile.html'" title="Trang cá nhân">
                    <i class="fa fa-user-circle"></i>
                </div>
                <span class="user-name-label">${user.HoTen}</span>
                <button onclick="handleLogout()" class="btn-logout-small" title="Đăng xuất">
                    <i class="fa fa-sign-out-alt"></i>
                </button>
            </div>
        `;
    } else {
        // Khi chưa đăng nhập: Hiện nút Đăng nhập như cũ
        authUI.innerHTML = `
            <button onclick="toggleAuthModal()" class="btn-login-trigger">
                <i class="fa fa-user-circle"></i>
                <span>Đăng nhập</span>
            </button>
        `;
    }
}

async function handleRegister() {
    const hoTen = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const matKhau = document.getElementById('reg-pass').value;
    const repass = document.getElementById('reg-repass').value;
    const sdt = document.getElementById('reg-phone').value;

    if (!hoTen || !email || !matKhau) return alert("Vui lòng điền các trường bắt buộc!");
    if (matKhau.length < 6) return alert("Mật khẩu phải từ 6 ký tự!");
    if (matKhau !== repass) return alert("Mật khẩu nhập lại không khớp!");

    try {
        const res = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hoTen, email, matKhau, sdt })
        });
        const result = await res.json();
        alert(result.message);
        if (result.success) switchAuthMode('login');
    } catch (err) { alert("Lỗi kết nối máy chủ!"); }
}

async function handleLogin() {
    const userInput = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    if (!userInput || !pass) return alert("Vui lòng nhập tài khoản và mật khẩu!");

    try {
        const res = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userInput, matKhau: pass })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
            alert("Đăng nhập thành công! Chào Admin " + data.user.HoTen);
            
            // Nếu là Admin, tự động chuyển đến trang quản lý sản phẩm
            if (data.user.VaiTro === 'admin') {
                window.location.href = 'admin_products.html'; 
            } else {
                location.reload();
            }
        } else alert(data.message);
    } catch (err) { alert("Lỗi kết nối server!"); }
}

function handleLogout() {
    if(confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        localStorage.removeItem('user');
        location.reload();
    }
}

// Thêm hàm này và gọi trong DOMContentLoaded
async function taiDanhMuc() {
    try {
        const res = await fetch('http://localhost:5000/api/danhmuc');
        const data = await res.json();
        const list = document.getElementById('category-list');
        
        // Chỉ hiển thị các danh mục con để khách dễ mua (hoặc tùy bạn thiết kế)
        const categoriesHtml = data.map(dm => `
            <li onclick="taiSanPhamTheoDanhMuc(${dm.MaDanhMuc})">${dm.TenDanhMuc}</li>
        `).join('');
        
        list.innerHTML += categoriesHtml;
    } catch (err) { console.error("Lỗi tải danh mục:", err); }
}

async function taiDanhMucHienThi() {
    try {
        const res = await fetch('http://localhost:5000/api/danhmuc');
        const data = await res.json();
        const parentList = document.getElementById('parent-category-list');

        // Lọc danh mục cha (MaDanhMucCha phải là null)
        const parents = data.filter(dm => dm.MaDanhMucCha === null);

        if (parents.length === 0) {
            console.error("Vẫn không tìm thấy danh mục cha! Hãy kiểm tra lại giá trị NULL trong SQL.");
            return;
        }

        parentList.innerHTML = parents.map(p => {
            const children = data.filter(c => c.MaDanhMucCha === p.MaDanhMuc);
            return `
                <li class="dropdown-item">
                    <a href="javascript:void(0)" onclick="locSanPhamTheoDanhMuc(${p.MaDanhMuc}, '${p.TenDanhMuc}')">
                        ${p.TenDanhMuc} ${children.length > 0 ? '<i class="fa fa-angle-right" style="float:right"></i>' : ''}
                    </a>
                    ${children.length > 0 ? `
                        <ul class="sub-dropdown">
                            ${children.map(c => `
                                <li><a href="javascript:void(0)" onclick="locSanPhamTheoDanhMuc(${c.MaDanhMuc}, '${c.TenDanhMuc}')">${c.TenDanhMuc}</a></li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </li>`;
        }).join('');
    } catch (err) { 
        console.error("Lỗi kết nối API:", err); 
    }
}

// Hàm lọc sản phẩm dùng chung
// Cập nhật hàm lọc sản phẩm trong DoAn.js
async function locSanPhamTheoDanhMuc(id, ten) {
    const list = document.getElementById('product-list');
    try {
        // Cập nhật tiêu đề
        document.querySelector('.section-title h2').innerText = ten.toUpperCase();

        const res = await fetch(`http://localhost:5000/api/sanpham/danhmuc/${id}`);
        const data = await res.json();
        
        if (data.length === 0) {
            list.innerHTML = `<p style="text-align:center; width:100%; padding:50px;">Không có sản phẩm trong mục này.</p>`;
            return;
        }

        // Vẽ lại danh sách sản phẩm
        list.innerHTML = data.map(sp => `
            <div class="product-card">
                <img src="${sp.LinkAnh || 'https://via.placeholder.com/200'}" alt="${sp.TenSanPham}">
                <h3>${sp.TenSanPham}</h3>
                <p class="price">${Number(sp.GiaBan).toLocaleString()} đ</p>
                <p class="stock">Kho: ${sp.TonKho}</p>
                <button class="btn-buy" ${sp.TonKho <= 0 ? 'disabled' : ''} 
                    onclick="moModal(${sp.MaSanPham}, '${sp.TenSanPham}', ${sp.GiaBan}, '${sp.LinkAnh}', ${sp.TonKho})">
                    ${sp.TonKho > 0 ? 'MUA NGAY' : 'HẾT HÀNG'}
                </button>
            </div>`).join('');
    } catch (err) { console.error("Lỗi lọc sản phẩm:", err); }
}   

// 1. Hàm bổ trợ: Vẽ danh sách sản phẩm ra giao diện
function renderProducts(data) {
    const list = document.getElementById('product-list');
    if (data.length === 0) {
        list.innerHTML = `<div style="text-align:center; width:100%; padding:50px;">
                            <i class="fa fa-box-open" style="font-size:48px; color:#ccc;"></i>
                            <p style="margin-top:10px; color:#888;">Không có sản phẩm nào trong mục này.</p>
                          </div>`;
        return;
    }

    list.innerHTML = data.map(sp => `
        <div class="product-card">
            <img src="${sp.LinkAnh || 'https://via.placeholder.com/200'}" alt="${sp.TenSanPham}">
            <h3>${sp.TenSanPham}</h3>
            <p class="price">${Number(sp.GiaBan).toLocaleString()} đ</p>
            <p class="stock">Kho: ${sp.TonKho}</p>
            <button class="btn-buy" ${sp.TonKho <= 0 ? 'disabled' : ''} 
                onclick="moModal(${sp.MaSanPham}, '${sp.TenSanPham}', ${sp.GiaBan}, '${sp.LinkAnh}', ${sp.TonKho})">
                ${sp.TonKho > 0 ? 'MUA NGAY' : 'HẾT HÀNG'}
            </button>
        </div>`).join('');
}

// 2. Hàm chính: Gọi API lọc sản phẩm khi người dùng click menu
async function locSanPhamTheoDanhMuc(id, ten) {
    try {
        // Cập nhật tiêu đề trang (Ví dụ: NÔNG SẢN KHÔ)
        const titleArea = document.querySelector('.section-title h2');
        if(titleArea) titleArea.innerText = ten.toUpperCase();

        const res = await fetch(`http://localhost:5000/api/sanpham/danhmuc/${id}`);
        const data = await res.json();
        
        renderProducts(data); // Hiển thị sản phẩm đã lọc
        
        // Cuộn trang xuống phần sản phẩm để khách dễ thấy
        window.scrollTo({ top: document.querySelector('.section-title').offsetTop - 100, behavior: 'smooth' });
    } catch (err) {
        console.error("Lỗi lọc sản phẩm:", err);
    }
}

let allProducts = []; // Khai báo mảng toàn cục để lưu trữ sản phẩm

// --- QUẢN LÝ SẢN PHẨM ---
async function taiSanPham() {
    const list = document.getElementById('product-list');
    try {
        const res = await fetch('http://localhost:5000/api/sanpham');
        const data = await res.json();
        allProducts = data; // Lưu dữ liệu vào mảng để dùng cho Modal
        
        list.innerHTML = data.map(sp => `
            <div class="product-card">
                <img src="${sp.LinkAnh || 'https://via.placeholder.com/200'}" alt="${sp.TenSanPham}">
                <h3>${sp.TenSanPham}</h3>
                <p style="font-size:12px; color:#888;">Đã bán: ${sp.LuotMua || 0} | ⭐ ${sp.LuotDanhGia || 0}</p>
                <p class="price">${Number(sp.GiaBan).toLocaleString()} đ</p>
                <button class="btn-buy" ${sp.TonKho <= 0 ? 'disabled' : ''} 
                    onclick="moModalDetail(${sp.MaSanPham})">
                    ${sp.TonKho > 0 ? 'XEM CHI TIẾT' : 'HẾT HÀNG'}
                </button>
            </div>`).join('');
    } catch (err) { console.error("Lỗi tải sản phẩm:", err); }
}

let currentReviews = [];
// Cập nhật logic trong DoAn.js
// DoAn.js - Cập nhật hàm mở modal
window.moModalDetail = async (id) => {
    const product = allProducts.find(p => p.MaSanPham === id);
    if (!product) return;

    // QUAN TRỌNG: Lưu đúng tên thuộc tính giống dữ liệu từ SQL
    currentProduct = { 
        MaSanPham: product.MaSanPham, 
        TenSanPham: product.TenSanPham, 
        GiaBan: product.GiaBan, 
        LinkAnh: product.LinkAnh, 
        TonKho: product.TonKho 
    };

    // Hiển thị thông tin lên Modal
    document.getElementById('detail-name').innerText = product.TenSanPham;
    document.getElementById('detail-price').innerText = Number(product.GiaBan || 0).toLocaleString() + ' đ';
    document.getElementById('detail-img').src = product.LinkAnh;
    document.getElementById('detail-stock').innerText = (product.TonKho || 0) + " sản phẩm";
    document.getElementById('detail-bought').innerText = product.LuotMua || 0;
    document.getElementById('detail-reviews-count').innerText = product.LuotDanhGia || 0;
    document.getElementById('detail-desc').innerText = product.MoTa || "Sản phẩm sạch từ Sơn La.";

    // Tải đánh giá (giữ nguyên logic fetch của bạn)
    try {
        const res = await fetch(`http://localhost:5000/api/sanpham/danhgia/chitiet/${id}`);
        const data = await res.json();
        currentReviews = data.reviews;
        const score = data.avg ? Number(data.avg).toFixed(1) : "0.0";
        document.getElementById('avg-stars-large').innerText = score;
        for(let i=1; i<=5; i++) {
            const stat = data.stats.find(s => s.SoSao === i);
            const btnCount = document.getElementById(`count-${i}`);
            if (btnCount) btnCount.innerText = stat ? stat.SoLuong : 0;
        }
        renderReviewList(currentReviews);
    } catch (e) { console.error(e); }

    document.getElementById('buy-qty').value = 1;
    document.getElementById('product-detail-modal').style.display = 'flex';
};
// Hàm vẽ danh sách đánh giá
function renderReviewList(list) {
    const container = document.getElementById('reviews-list-content');
    if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:20px; color:#999;">Chưa có đánh giá nào.</p>`;
        return;
    }

    container.innerHTML = list.map(r => `
        <div class="review-item" style="border-bottom: 1px solid #eee; padding: 15px 0;">
            <div style="display: flex; gap: 10px;">
                <i class="fa fa-user-circle" style="font-size: 35px; color: #ccc;"></i>
                <div style="flex: 1;">
                    <div style="font-size: 13px; font-weight: bold;">${r.HoTen}</div>
                    <div style="color: #ee4d2d; font-size: 12px; margin: 3px 0;">${'⭐'.repeat(r.SoSao)}</div>
                    <div style="font-size: 12px; color: #757575; margin-bottom: 8px;">${new Date(r.NgayDanhGia).toLocaleString('vi-VN')}</div>
                    <div style="font-size: 14px; line-height: 1.4;">${r.NoiDung || 'Người mua không để lại bình luận.'}</div>
                </div>
            </div>
        </div>
    `).join('');
}

window.filterReviews = (sao) => {
    // Đổi màu nút active
    const btns = document.querySelectorAll('.btn-filter');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if(sao === 0) renderReviewList(currentReviews);
    else {
        const filtered = currentReviews.filter(r => r.SoSao === sao);
        renderReviewList(filtered);
    }
};
// Cập nhật hàm render trong lọc danh mục để đồng bộ
// DoAn.js - Tìm hàm renderProducts và thay thế hoàn toàn bằng bản này
function renderProducts(data) {
    allProducts = data; // Cập nhật lại mảng để khi nhấn Xem chi tiết không bị lỗi
    const list = document.getElementById('product-list');
    
    if (data.length === 0) {
        list.innerHTML = `<div style="text-align:center; width:100%; padding:50px;">
                            <i class="fa fa-box-open" style="font-size:48px; color:#ccc;"></i>
                            <p style="margin-top:10px; color:#888;">Không tìm thấy sản phẩm nào phù hợp!</p>
                          </div>`;
        return;
    }

    list.innerHTML = data.map(sp => {
        const isOutOfStock = sp.TonKho <= 0;
        const isLowStock = sp.TonKho > 0 && sp.TonKho <= 10;

        return `
        <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}">
            <img src="${sp.LinkAnh || 'https://via.placeholder.com/200'}" alt="${sp.TenSanPham}" style="${isOutOfStock ? 'filter: grayscale(1);' : ''}">
            <h3>${sp.TenSanPham}</h3>
            <p style="font-size:12px; color:#888;">Đã bán: ${sp.LuotMua || 0} | ⭐ ${sp.LuotDanhGia || 0}</p>
            <div class="stock-status-badge">
                ${isOutOfStock ? '<span style="color:red; font-weight:bold;">Tạm hết hàng</span>' : 
                  isLowStock ? `<span style="color:#ff9800; font-size:12px;">🔥 Chỉ còn ${sp.TonKho} món</span>` : 
                  `<span style="color:#888; font-size:11px;">Còn lại: ${sp.TonKho}</span>`}
            </div>
            <p class="price">${Number(sp.GiaBan || 0).toLocaleString()} đ</p>
            <button class="btn-buy" onclick="moModalDetail(${sp.MaSanPham})">
                ${isOutOfStock ? 'XEM CHI TIẾT' : 'XEM CHI TIẾT'}
            </button>
        </div>`;
    }).join('');
}

window.scrollToReviews = () => {
    const target = document.getElementById('reviews-section-target');
    const modal = document.getElementById('product-detail-modal');
    
    if (target && modal) {
        // Vì Modal có thuộc tính overflow-y: auto, ta cuộn chính Modal đó
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// Thêm đoạn này vào file DoAn.js

// --- LOGIC TÌM KIẾM TỪ HEADER ---
// DoAn.js - Tìm và thay thế hàm handleHeaderSearch bằng bản này
async function handleHeaderSearch() {
    const input = document.getElementById('header-search-input');
    const keyword = input.value.trim();

    if (!keyword) {
        alert("Vui lòng nhập tên sản phẩm cần tìm!");
        return;
    }

    const list = document.getElementById('product-list');
    list.innerHTML = "<p style='text-align:center; width:100%; padding:20px;'>Đang tìm kiếm...</p>";

    try {
        // Gửi yêu cầu đến đúng cổng 5000 của Backend
        const res = await fetch(`${API_URL}/api/sanpham/search?keyword=${encodeURIComponent(keyword)}`);
        
        if (!res.ok) throw new Error("API không tồn tại hoặc lỗi Server");

        const data = await res.json();
        
        // Cập nhật lại mảng toàn cục để tính năng "Xem chi tiết" hoạt động
        allProducts = data; 

        // Đổi tiêu đề mục sản phẩm
        const titleEl = document.querySelector('.section-title h2');
        if (titleEl) titleEl.innerText = `KẾT QUẢ CHO: "${keyword.toUpperCase()}"`;

        // Hiển thị kết quả bằng hàm renderProducts có sẵn
        renderProducts(data);

        // Tự động cuộn xuống phần sản phẩm để khách thấy kết quả ngay
        window.scrollTo({ top: 500, behavior: 'smooth' });

    } catch (err) {
        console.error("Lỗi tìm kiếm:", err);
        list.innerHTML = `<p style="color:red; text-align:center; width:100%;">Lỗi: ${err.message}</p>`;
    }
}
// Hỗ trợ người dùng nhấn phím Enter để tìm kiếm luôn
document.getElementById('header-search-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleHeaderSearch();
});

// --- LOGIC GỢI Ý TÌM KIẾM ---

let suggestTimeout = null;

async function handleSuggest() {
    const input = document.getElementById('header-search-input');
    const suggestBox = document.getElementById('search-suggestions');
    const keyword = input.value.trim();

    clearTimeout(suggestTimeout);
    if (keyword.length < 1) {
        suggestBox.style.display = 'none';
        return;
    }

    suggestTimeout = setTimeout(async () => {
        try {
            // Gọi đúng cổng 5000 của Server Node.js
            const res = await fetch(`${API_URL}/api/sanpham/suggest?keyword=${encodeURIComponent(keyword)}`);
            
            // Nếu API chưa được tạo, Server trả về HTML -> Báo lỗi ở đây
            if (!res.ok) throw new Error("API suggest không tồn tại!");

            const data = await res.json();

            if (data.length > 0) {
                suggestBox.innerHTML = data.map(item => `
                    <div class="suggest-item" 
                         style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f5f5f5; font-size: 14px;" 
                         onclick="selectSuggest('${item.TenSanPham}')">
                        <i class="fa fa-search" style="color: #aaa; margin-right: 10px;"></i> ${item.TenSanPham}
                    </div>
                `).join('');
                suggestBox.style.display = 'block';
            } else {
                suggestBox.style.display = 'none';
            }
        } catch (err) { 
            console.error("Lỗi gợi ý:", err); 
            suggestBox.style.display = 'none';
        }
    }, 300);
}

// Khi người dùng click vào một gợi ý
window.selectSuggest = (value) => {
    document.getElementById('header-search-input').value = value;
    document.getElementById('search-suggestions').style.display = 'none';
    handleHeaderSearch(); // Thực hiện tìm kiếm luôn
};

// Ẩn gợi ý khi click ra ngoài
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
        document.getElementById('search-suggestions').style.display = 'none';
    }
});