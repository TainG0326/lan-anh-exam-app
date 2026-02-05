import GlassCard from '../components/GlassCard';

export default function Gradebook() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tighter mb-2">
          Bảng điểm
        </h1>
        <p className="text-text-secondary">
          Xem điểm số và thống kê của học sinh
        </p>
      </div>

      {/* Gradebook Content - Glass Card */}
      <GlassCard className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary">Gradebook</h2>
          </div>
          <span className="px-3 py-1 bg-white/30 backdrop-blur-md rounded-full text-xs font-semibold text-text-secondary border border-white/20">
            Coming Soon
          </span>
        </div>

        {/* Placeholder Content */}
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-float">
            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">Tính năng đang phát triển</h3>
          <p className="text-text-secondary text-center max-w-md">
            Chức năng quản lý điểm số đang được phát triển. Vui lòng quay lại sau.
          </p>
        </div>

        {/* Feature Preview */}
        <div className="mt-8 pt-8 border-t border-white/20">
          <h4 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">
            Sắp có
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-text-primary">Student Management</p>
              <p className="text-xs text-text-secondary mt-1">Quản lý học sinh theo lớp</p>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-text-primary">Grade Analytics</p>
              <p className="text-xs text-text-secondary mt-1">Thống kê và phân tích điểm</p>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-text-primary">Export Reports</p>
              <p className="text-xs text-text-secondary mt-1">Xuất báo cáo điểm số</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
