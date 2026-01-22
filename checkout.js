document.addEventListener('DOMContentLoaded', () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
        alert("🛒 Vui lòng chọn sản phẩm trước khi đặt hàng!");
        window.location.href = 'DoAn.html';
        return;
    }
    loadCheckoutDetails();
});

function loadCheckoutDetails() {
    const list = document.getElementById('checkout-items-list');
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    let subtotal = 0;

    // 1. Hiển thị danh sách sản phẩm và tính tạm tính
    list.innerHTML = cart.map(item => {
        const price = parseFloat(item.GiaBan || 0);
        const qty = parseInt(item.SoLuongThuc || 0);
        subtotal += price * qty;
        return `<div class="review-item">
            <span>${item.TenSanPham} x ${qty}</span>
            <span>${(price * qty).toLocaleString()} đ</span>
        </div>`;
    }).join('');

    document.getElementById('subtotal').innerText = subtotal.toLocaleString() + ' đ';
    updateShipping();

    // 2. TỰ ĐỘNG ĐIỀN THÔNG TIN USER
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        // Điền họ tên từ thông tin đăng nhập
        if (user.HoTen) {
            document.getElementById('cus-name').value = user.HoTen;
        }
        // Điền số điện thoại từ thông tin đăng nhập
        if (user.SoDienThoai) {
            document.getElementById('cus-phone').value = user.SoDienThoai;
        }
    }
}

function updateShipping() {
    const select = document.getElementById('shipping-method');
    const shipFee = parseInt(select.options[select.selectedIndex].getAttribute('data-price'));
    const subtotal = parseInt(document.getElementById('subtotal').innerText.replace(/\D/g, ''));
    
    document.getElementById('ship-fee').innerText = shipFee.toLocaleString() + ' đ';
    document.getElementById('final-total').innerText = (subtotal + shipFee).toLocaleString() + ' đ';
    
    if(document.getElementById('payment-method').value === 'Chuyển khoản') toggleOnlinePayment();
}

function toggleOnlinePayment() {
    const pttt = document.getElementById('payment-method').value;
    const qrContainer = document.getElementById('qr-container');
    
    if (pttt === 'Chuyển khoản') {
        const total = document.getElementById('final-total').innerText.replace(/\D/g, '');
        const content = "THANHTOAN" + Math.floor(Math.random() * 10000);
        const qrUrl = `https://img.vietqr.io/image/MB-770164325-compact.png?amount=${total}&addInfo=${content}`;
        
        document.getElementById('qr-image').src = qrUrl;
        document.getElementById('qr-content').innerText = content;
        qrContainer.style.display = 'block';
    } else {
        qrContainer.style.display = 'none';
    }
}

document.getElementById('complete-checkout-form').onsubmit = async (e) => {
    e.preventDefault();
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
        alert("⚠️ Giỏ hàng của bạn đang trống!");
        return;
    }

    const soNha = document.getElementById('cus-address').value;
    const phuongXa = document.getElementById('cus-ward').value;
    const quanHuyen = document.getElementById('cus-dist').value;
    const tinhThanh = document.getElementById('cus-city').value;
    const diaChiDayDu = `${soNha}, ${phuongXa}, ${quanHuyen}, ${tinhThanh}`;

    const formattedCart = cart.map(item => ({
        MaSanPham: item.MaSanPham || item.id,
        TenSanPham: item.TenSanPham || item.name,
        SoLuong: item.SoLuongThuc || item.quantity,
        GiaBan: item.GiaBan || item.price
    }));

    const orderData = {
        khachHang: {
            ten: document.getElementById('cus-name').value,
            sdt: document.getElementById('cus-phone').value,
            dc_chitiet: diaChiDayDu
        },
        vanChuyen: {
            hinhThuc: document.getElementById('shipping-method').value,
            phiShip: parseInt(document.getElementById('ship-fee').innerText.replace(/\D/g, '')),
            donVi: document.getElementById('shipping-unit').value
        },
        thanhToan: {
            pttt: document.getElementById('payment-method').value,
            trangThai: document.getElementById('payment-method').value === 'Chuyển khoản' ? "Đã chuyển khoản (Chờ xác nhận)" : "Chưa thanh toán"
        },
        tongTien: parseInt(document.getElementById('final-total').innerText.replace(/\D/g, '')),
        gioHang: formattedCart 
    };

    try {
        const res = await fetch('https://nongsansonla.loca.lt/api/dathang', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const result = await res.json();
        if (result.success) {
            alert("✅ ĐẶT HÀNG THÀNH CÔNG!");
            localStorage.removeItem('cart');
            window.location.href = 'DoAn.html';
        }
    } catch (err) {
        alert("❌ Lỗi kết nối đến máy chủ!");
    }
};
