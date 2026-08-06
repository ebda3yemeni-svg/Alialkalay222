import React from 'react';
import { TreePine, Award, ShieldCheck, Heart, Users, Sparkles, BookOpen } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Banner */}
      <div className="bg-gradient-to-br from-[#1A2A40] via-[#243B55] to-[#1A2A40] text-white p-8 sm:p-12 rounded-2xl shadow-2xl text-center space-y-4 border border-[#C5A059]/40">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#243B55] flex items-center justify-center shadow-2xl border-2 border-[#C5A059]">
          <TreePine className="w-10 h-10 text-[#C5A059]" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold font-amiri text-[#C5A059]">
          عن موسوعة الأنساب لبني علي الكلعي
        </h1>

        <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
          منصة إلكترونية متكاملة موثقة تهدف لحفظ الأنساب والسلسلة التاريخية للأسرة والقبيلة وفق أعلى معايير الدقة والتوثيق الرقمي.
        </p>
      </div>

      {/* Goal Card */}
      <div className="bg-white p-8 rounded-2xl border border-[#C5A059]/30 shadow-sm space-y-4 text-right">
        <div className="flex items-center gap-3 text-[#1A2A40]">
          <BookOpen className="w-7 h-7 text-[#C5A059]" />
          <h2 className="text-2xl font-bold font-amiri">هدف المشروع الرئيسي</h2>
        </div>

        <p className="text-base text-gray-700 leading-relaxed font-medium">
          إنشاء أرشيف رقمي دائم وموثق يحفظ تاريخ العائلة وأنسابها للأجيال القادمة، يتيح استكشاف السلسلة المباشرة بدءاً من الجد الأكبر ووصولاً إلى أحدث الأجيال بكل يسر وسهولة مع منع اندثار الموروث الشفهي والوثائق التاريخية.
        </p>
      </div>

      {/* Supervision & Developers */}
      <div className="bg-[#F0F4F8] p-8 rounded-2xl border border-[#C5A059]/30 shadow-sm space-y-6 text-right">
        <div className="flex items-center gap-3 text-[#1A2A40]">
          <Award className="w-7 h-7 text-[#C5A059]" />
          <h2 className="text-2xl font-bold font-amiri">الإشراف العلمي والتطوير</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-xl border border-[#C5A059]/30 shadow-sm space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#1A2A40] text-[#C5A059] font-bold flex items-center justify-center text-xl mb-3 border border-[#C5A059]">
              د
            </div>
            <h3 className="text-xl font-bold text-[#1A2A40] font-amiri">د. أشرف عارف</h3>
            <p className="text-xs text-[#C5A059] font-bold">مصمم ومطور الموقع الرئيسي</p>
            <p className="text-xs text-[#1A2A40] font-semibold">إشراف وتوثيق النسَب العلمي والتاريخي</p>
            <p className="text-xs text-gray-600 leading-relaxed pt-1">
              مشارك في إعداد المراجع التاريخية وتدقيق الشجرة السلالية والسلسلة المعتمدة.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-[#C5A059]/30 shadow-sm space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#1A2A40] text-[#C5A059] font-bold flex items-center justify-center text-xl mb-3 border border-[#C5A059]">
              د
            </div>
            <h3 className="text-xl font-bold text-[#1A2A40] font-amiri">د. تميم بكيّل</h3>
            <p className="text-xs text-[#C5A059] font-bold">إشراف وتدقيق السجلات والمستندات</p>
            <p className="text-xs text-gray-600 leading-relaxed pt-1">
              مشارك في بناء الأرشيف الرقمي ومراجعة الوثائق والمخطوطات العائلية.
            </p>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="bg-white p-8 rounded-3xl border border-amber-200 shadow-sm space-y-4 text-right">
        <h3 className="text-xl font-bold font-amiri text-amber-950">مميزات النظام التقني</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-stone-700">
          <li className="flex items-center gap-2 p-2 bg-amber-50 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            حفظ دائم ومستمر في قاعدة بيانات PostgreSQL الحقيقية
          </li>
          <li className="flex items-center gap-2 p-2 bg-amber-50 rounded-xl">
            <TreePine className="w-4 h-4 text-amber-700" />
            شجرة تفاعلية بـ 7 أنماط عرض مختلفة
          </li>
          <li className="flex items-center gap-2 p-2 bg-amber-50 rounded-xl">
            <Users className="w-4 h-4 text-amber-700" />
            احتساب القرابة والنسب تلقائياً دون تعقيد
          </li>
          <li className="flex items-center gap-2 p-2 bg-amber-50 rounded-xl">
            <Sparkles className="w-4 h-4 text-amber-700" />
            نظام ذكي للحد من تكرار الأسماء وتدقيقها
          </li>
        </ul>
      </div>

    </div>
  );
};
