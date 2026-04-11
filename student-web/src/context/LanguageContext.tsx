import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'vi' | 'en';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Navigation
    'nav.dashboard': 'Trang chủ',
    'nav.exams': 'Đề thi',
    'nav.assignments': 'Bài tập',
    'nav.grades': 'Điểm số',
    'nav.classes': 'Lớp học',
    'nav.profile': 'Hồ sơ',
    
    // Common
    'common.save': 'Lưu thay đổi',
    'common.saving': 'Đang lưu...',
    'common.loading': 'Đang tải...',
    'common.cancel': 'Hủy',
    'common.confirm': 'Xác nhận',
    'common.delete': 'Xóa',
    'common.edit': 'Chỉnh sửa',
    'common.back': 'Quay lại',
    'common.search': 'Tìm kiếm',
    'common.filter': 'Lọc',
    'common.verified': '✓',
    'common.logout': 'Đăng xuất',
    
    // Profile
    'profile.title': 'Hồ sơ cá nhân',
    'profile.personal': 'Thông tin cá nhân',
    'profile.security': 'Bảo mật',
    'profile.preferences': 'Tùy chọn',
    'profile.notifications': 'Thông báo',
    'profile.notifications_all': 'Tất cả thông báo',
    'profile.notifications_unread': 'Thông báo chưa đọc',
    'profile.name': 'Họ và tên',
    'profile.email': 'Email',
    'profile.phone': 'Số điện thoại',
    'profile.address': 'Địa chỉ',
    'profile.password': 'Mật khẩu',
    'profile.currentPassword': 'Mật khẩu hiện tại',
    'profile.newPassword': 'Mật khẩu mới',
    'profile.confirmPassword': 'Xác nhận mật khẩu',
    'profile.joinedDate': 'Ngày tham gia',
    'profile.updateInfo': 'Cập nhật thông tin của bạn',
    'profile.accountSecurity': 'Bảo mật tài khoản',
    'profile.managePassword': 'Quản lý mật khẩu và bảo mật',
    'profile.customize': 'Tùy chỉnh trải nghiệm của bạn',
    'profile.notificationsDesc': 'Quản lý thông báo bạn nhận được',
    'profile.languageTitle': 'Ngôn ngữ / Language',
    'profile.placeholder.name': 'Nhập họ và tên',
    'profile.placeholder.email': 'Nhập email',
    'profile.placeholder.phone': 'Nhập số điện thoại',
    'profile.placeholder.address': 'Nhập địa chỉ',
    'profile.placeholder.currentPassword': 'Nhập mật khẩu hiện tại',
    'profile.placeholder.newPassword': 'Nhập mật khẩu mới (tối thiểu 6 ký tự)',
    'profile.placeholder.confirmPassword': 'Nhập lại mật khẩu mới',
    'profile.saveChanges': 'Lưu thay đổi',
    'profile.updatePassword': 'Cập nhật mật khẩu',
    'profile.passwordTip': 'Để trống các ô mật khẩu nếu bạn không muốn thay đổi mật khẩu',
    'profile.noEmail': 'Chưa có',
    'profile.stats.assignments': 'Bài tập',
    'profile.stats.completed': 'Đã thi',
    'profile.stats.average': 'Điểm TB',
    'profile.notifications.assignment': 'Cập nhật bài tập',
    'profile.notifications.assignmentDesc': 'Khi có bài tập mới được giao',
    'profile.notifications.grade': 'Thông báo điểm',
    'profile.notifications.gradeDesc': 'Khi có điểm mới được công bố',
    'profile.notifications.exam': 'Nhắc thi',
    'profile.notifications.examDesc': 'Trước ngày kiểm tra',
    'profile.notifications.class': 'Cập nhật lớp học',
    'profile.notifications.classDesc': 'Thông báo từ lớp học',
    'profile.preferences.emailNotify': 'Email Notifications',
    'profile.preferences.emailNotifyDesc': 'Nhận thông báo qua email',
    'profile.preferences.weeklyDigest': 'Weekly Digest',
    'profile.preferences.weeklyDigestDesc': 'Nhận báo cáo hàng tuần',
    
    // Toast messages
    'toast.imageType': 'Vui lòng chọn file hình ảnh',
    'toast.imageSize': 'Kích thước ảnh phải nhỏ hơn 5MB',
    'toast.avatarSuccess': 'Cập nhật ảnh đại diện thành công!',
    'toast.uploadFailed': 'Tải ảnh lên thất bại',
    'toast.removeAvatarSuccess': 'Xóa ảnh đại diện thành công!',
    'toast.removeAvatarFailed': 'Xóa ảnh thất bại',
    'toast.passwordMin': 'Mật khẩu mới phải có ít nhất 6 ký tự',
    'toast.passwordMismatch': 'Mật khẩu mới không khớp',
    'toast.updateSuccess': 'Cập nhật thông tin thành công!',
    'toast.updateFailed': 'Cập nhật thất bại',
    
    // Dashboard
    'dashboard.welcome': 'Xin chào',
    'dashboard.student': 'Học sinh',
    'dashboard.activeExams': 'Đề thi đang mở',
    'dashboard.upcomingAssignments': 'Bài tập sắp tới',
    'dashboard.upcomingExams': 'Kỳ thi sắp tới',
    'dashboard.quickActions': 'Hành động nhanh',
    'dashboard.expired': 'Đã hết hạn',
    'dashboard.available': 'Khả dụng',
    'dashboard.started': 'Đã bắt đầu',
    'dashboard.continue': 'Tiếp tục làm bài',
    'dashboard.dueIn': 'Còn',
    'dashboard.overdue': 'Quá hạn',
    'dashboard.notSubmitted': 'Chưa nộp',
    'dashboard.submitted': 'Đã nộp',
    
    // Grades
    'grades.title': 'Điểm số',
    'grades.subject': 'Môn học',
    'grades.score': 'Điểm',
    'grades.average': 'Điểm trung bình',
    'grades.rank': 'Xếp hạng',
    'grades.excellent': 'Xuất sắc',
    'grades.good': 'Giỏi',
    'grades.averageGrade': 'Khá',
    'grades.averageScore': 'Trung bình',
    'grades.weak': 'Yếu',
    'grades.total': 'Tổng điểm',
    'grades.gradeLabel': 'Xếp loại',
    
    // Exams
    'exams.title': 'Đề thi',
    'exams.duration': 'Thời gian',
    'exams.questions': 'Số câu hỏi',
    'exams.start': 'Bắt đầu',
    'exams.view': 'Xem chi tiết',
    'exams.minutes': 'phút',
    'exams.minute': 'phút',
    'exams.all': 'Tất cả',
    'exams.completed': 'Đã hoàn thành',
    'exams.notStarted': 'Chưa làm',
    'exams.inProgress': 'Đang làm',
    
    // Assignments
    'assignments.title': 'Bài tập',
    'assignments.dueDate': 'Hạn nộp',
    'assignments.status': 'Trạng thái',
    'assignments.submitted': 'Đã nộp',
    'assignments.pending': 'Chưa nộp',
    'assignments.submit': 'Nộp bài',
    'assignments.daysLeft': 'ngày',
    'assignments.hoursLeft': 'giờ',
    'assignments.overdue': 'Quá hạn',
    'assignments.submittedOn': 'Đã nộp lúc',
    
    // Language & Theme
    'settings.language': 'Ngôn ngữ',
    'settings.theme': 'Giao diện',
    'settings.light': 'Sáng',
    'settings.dark': 'Tối',
    'settings.system': 'Hệ thống',
    'settings.vietnamese': 'Tiếng Việt',
    'settings.english': 'English',
    
    // Notifications
    'notify.assignment': 'Cập nhật bài tập',
    'notify.grade': 'Thông báo điểm',
    'notify.exam': 'Nhắc thi',
    'notify.class': 'Cập nhật lớp học',
    'notify.email': 'Email Notifications',
    'notify.weekly': 'Weekly Digest',
    
    // Join Class
    'joinclass.title': 'Tham gia lớp học',
    'joinclass.code': 'Mã lớp',
    'joinclass.join': 'Tham gia',
    'joinclass.enterCode': 'Nhập mã lớp học',
    'joinclass.joinSuccess': 'Tham gia lớp học thành công!',
    'joinclass.joinFailed': 'Mã lớp không đúng hoặc đã hết hạn',
    'joinclass.alreadyJoined': 'Bạn đã tham gia lớp học này',
    
    // Class Detail
    'classdetail.title': 'Thông tin lớp học',
    'classdetail.teacher': 'Giáo viên',
    'classdetail.classCode': 'Mã lớp',
    'classdetail.grade': 'Khối',
    'classdetail.level': 'Lớp',
    'classdetail.createdAt': 'Ngày tạo',
    'classdetail.leaveClass': 'Rời khỏi lớp',
    'classdetail.leaveConfirm': 'Bạn có chắc chắn muốn rời khỏi lớp này?',
    'classdetail.leaveSuccess': 'Rời khỏi lớp thành công!',
    'classdetail.students': 'Học sinh',
    'classdetail.assignments': 'Bài tập',
    'classdetail.exams': 'Kỳ thi',
    'classdetail.back': 'Quay lại',
    'classdetail.joinedDate': 'Ngày tham gia',
    
    // Take Exam
    'takeexam.timeRemaining': 'Thời gian còn lại',
    'takeexam.question': 'Câu hỏi',
    'takeexam.next': 'Tiếp theo',
    'takeexam.previous': 'Trước',
    'takeexam.submit': 'Nộp bài',
    'takeexam.confirmSubmit': 'Xác nhận nộp bài?',
    'takeexam.confirmMessage': 'Bạn có chắc chắn muốn nộp bài không?',
    'takeexam.timeUp': 'Hết giờ!',
    'takeexam.submitted': 'Bài thi đã được nộp',
    'takeexam.yourScore': 'Điểm của bạn',
    'takeexam.correctAnswers': 'Câu trả lời đúng',
    
    // Empty states
    'empty.noExams': 'Không có đề thi nào',
    'empty.noAssignments': 'Không có bài tập nào',
    'empty.noGrades': 'Chưa có điểm số',
    'empty.noNotifications': 'Không có thông báo',
    'empty.noClasses': 'Chưa tham gia lớp học nào',
    'empty.noActiveExams': 'Không có đề thi nào đang mở',
    'empty.noUpcoming': 'Không có bài tập nào sắp tới',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.exams': 'Exams',
    'nav.assignments': 'Assignments',
    'nav.grades': 'Grades',
    'nav.classes': 'Classes',
    'nav.profile': 'Profile',
    
    // Common
    'common.save': 'Save Changes',
    'common.saving': 'Saving...',
    'common.loading': 'Loading...',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.verified': '✓',
    'common.logout': 'Logout',
    
    // Profile
    'profile.title': 'Personal Profile',
    'profile.personal': 'Personal Information',
    'profile.security': 'Security',
    'profile.preferences': 'Preferences',
    'profile.notifications': 'Notifications',
    'profile.notifications_all': 'All notifications',
    'profile.notifications_unread': 'Unread notifications',
    'profile.name': 'Full Name',
    'profile.email': 'Email',
    'profile.phone': 'Phone Number',
    'profile.address': 'Address',
    'profile.password': 'Password',
    'profile.currentPassword': 'Current Password',
    'profile.newPassword': 'New Password',
    'profile.confirmPassword': 'Confirm Password',
    'profile.joinedDate': 'Joined Date',
    'profile.updateInfo': 'Update your information',
    'profile.accountSecurity': 'Account Security',
    'profile.managePassword': 'Manage password and security',
    'profile.customize': 'Customize your experience',
    'profile.notificationsDesc': 'Manage notifications you receive',
    'profile.languageTitle': 'Language / Ngôn ngữ',
    'profile.placeholder.name': 'Enter your full name',
    'profile.placeholder.email': 'Enter your email',
    'profile.placeholder.phone': 'Enter your phone number',
    'profile.placeholder.address': 'Enter your address',
    'profile.placeholder.currentPassword': 'Enter current password',
    'profile.placeholder.newPassword': 'Enter new password (min 6 characters)',
    'profile.placeholder.confirmPassword': 'Confirm new password',
    'profile.saveChanges': 'Save Changes',
    'profile.updatePassword': 'Update Password',
    'profile.passwordTip': 'Leave password fields empty if you do not want to change password',
    'profile.noEmail': 'Not provided',
    'profile.stats.assignments': 'Assignments',
    'profile.stats.completed': 'Completed',
    'profile.stats.average': 'Average',
    'profile.notifications.assignment': 'Assignment Updates',
    'profile.notifications.assignmentDesc': 'When new assignments are given',
    'profile.notifications.grade': 'Grade Notifications',
    'profile.notifications.gradeDesc': 'When new grades are published',
    'profile.notifications.exam': 'Exam Reminders',
    'profile.notifications.examDesc': 'Before exam day',
    'profile.notifications.class': 'Class Updates',
    'profile.notifications.classDesc': 'Notifications from class',
    'profile.preferences.emailNotify': 'Email Notifications',
    'profile.preferences.emailNotifyDesc': 'Receive notifications via email',
    'profile.preferences.weeklyDigest': 'Weekly Digest',
    'profile.preferences.weeklyDigestDesc': 'Receive weekly reports',
    
    // Toast messages
    'toast.imageType': 'Please select an image file',
    'toast.imageSize': 'Image size must be less than 5MB',
    'toast.avatarSuccess': 'Avatar updated successfully!',
    'toast.uploadFailed': 'Failed to upload image',
    'toast.removeAvatarSuccess': 'Avatar removed successfully!',
    'toast.removeAvatarFailed': 'Failed to remove avatar',
    'toast.passwordMin': 'New password must be at least 6 characters',
    'toast.passwordMismatch': 'New passwords do not match',
    'toast.updateSuccess': 'Information updated successfully!',
    'toast.updateFailed': 'Update failed',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.student': 'Student',
    'dashboard.activeExams': 'Active Exams',
    'dashboard.upcomingAssignments': 'Upcoming Assignments',
    'dashboard.upcomingExams': 'Upcoming Exams',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.expired': 'Expired',
    'dashboard.available': 'Available',
    'dashboard.started': 'Started',
    'dashboard.continue': 'Continue',
    'dashboard.dueIn': 'Due in',
    'dashboard.overdue': 'Overdue',
    'dashboard.notSubmitted': 'Not Submitted',
    'dashboard.submitted': 'Submitted',
    
    // Grades
    'grades.title': 'Grades',
    'grades.subject': 'Subject',
    'grades.score': 'Score',
    'grades.average': 'Average',
    'grades.rank': 'Rank',
    'grades.excellent': 'Excellent',
    'grades.good': 'Good',
    'grades.averageGrade': 'Average',
    'grades.averageScore': 'Fair',
    'grades.weak': 'Needs Improvement',
    'grades.total': 'Total Score',
    'grades.gradeLabel': 'Grade',
    
    // Exams
    'exams.title': 'Exams',
    'exams.duration': 'Duration',
    'exams.questions': 'Questions',
    'exams.start': 'Start',
    'exams.view': 'View Details',
    'exams.minutes': 'minutes',
    'exams.minute': 'minute',
    'exams.all': 'All',
    'exams.completed': 'Completed',
    'exams.notStarted': 'Not Started',
    'exams.inProgress': 'In Progress',
    
    // Assignments
    'assignments.title': 'Assignments',
    'assignments.dueDate': 'Due Date',
    'assignments.status': 'Status',
    'assignments.submitted': 'Submitted',
    'assignments.pending': 'Pending',
    'assignments.submit': 'Submit',
    'assignments.daysLeft': 'days left',
    'assignments.hoursLeft': 'hours left',
    'assignments.overdue': 'Overdue',
    'assignments.submittedOn': 'Submitted at',
    
    // Language & Theme
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.system': 'System',
    'settings.vietnamese': 'Tiếng Việt',
    'settings.english': 'English',
    
    // Notifications
    'notify.assignment': 'Assignment Updates',
    'notify.grade': 'Grade Notifications',
    'notify.exam': 'Exam Reminders',
    'notify.class': 'Class Updates',
    'notify.email': 'Email Notifications',
    'notify.weekly': 'Weekly Digest',
    
    // Join Class
    'joinclass.title': 'Join Class',
    'joinclass.code': 'Class Code',
    'joinclass.join': 'Join',
    'joinclass.enterCode': 'Enter class code',
    'joinclass.joinSuccess': 'Joined class successfully!',
    'joinclass.joinFailed': 'Invalid or expired class code',
    'joinclass.alreadyJoined': 'You have already joined this class',
    
    // Class Detail
    'classdetail.title': 'Class Information',
    'classdetail.teacher': 'Teacher',
    'classdetail.classCode': 'Class Code',
    'classdetail.grade': 'Grade',
    'classdetail.level': 'Class',
    'classdetail.createdAt': 'Created Date',
    'classdetail.leaveClass': 'Leave Class',
    'classdetail.leaveConfirm': 'Are you sure you want to leave this class?',
    'classdetail.leaveSuccess': 'Left class successfully!',
    'classdetail.students': 'Students',
    'classdetail.assignments': 'Assignments',
    'classdetail.exams': 'Exams',
    'classdetail.back': 'Back',
    'classdetail.joinedDate': 'Joined Date',
    
    // Take Exam
    'takeexam.timeRemaining': 'Time Remaining',
    'takeexam.question': 'Question',
    'takeexam.next': 'Next',
    'takeexam.previous': 'Previous',
    'takeexam.submit': 'Submit',
    'takeexam.confirmSubmit': 'Confirm Submit?',
    'takeexam.confirmMessage': 'Are you sure you want to submit?',
    'takeexam.timeUp': 'Time\'s up!',
    'takeexam.submitted': 'Exam has been submitted',
    'takeexam.yourScore': 'Your Score',
    'takeexam.correctAnswers': 'Correct Answers',
    
    // Empty states
    'empty.noExams': 'No exams available',
    'empty.noAssignments': 'No assignments available',
    'empty.noGrades': 'No grades yet',
    'empty.noNotifications': 'No notifications',
    'empty.noClasses': 'No classes joined yet',
    'empty.noActiveExams': 'No active exams',
    'empty.noUpcoming': 'No upcoming assignments',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('appLanguage');
    if (saved && (saved === 'vi' || saved === 'en')) {
      return saved as Language;
    }
    return 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
