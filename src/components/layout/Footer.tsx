import React from 'react';
import {
  Film,
  ShieldCheck,
  Database,
  Lock,
  Youtube,
  Twitter,
  Github,
  Instagram,
  Facebook,
  Send,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Linkedin,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { FooterLink, FooterSection, FooterSocialLink } from '../../types';

interface FooterProps {
  navigate: (path: string) => void;
  // Optional preview mode flag when embedded inside admin settings preview
  previewSettings?: any;
}

export const Footer: React.FC<FooterProps> = ({ navigate, previewSettings }) => {
  const contextSettings = useSiteSettings();
  const settings = previewSettings || contextSettings.settings;

  const footerName = settings.footer_name || settings.site_name || 'StreamVault';
  const rawDesc = settings.footer_description || settings.site_description || '';
  const footerDesc =
    rawDesc ===
    'Enterprise-grade video streaming platform architected with Supabase Auth, PostgreSQL with Row-Level Security, Supabase Storage, and granular Role-Based Access Control.'
      ? ''
      : rawDesc;

  const logoUrl = settings.footer_logo_url || settings.main_logo_url;

  // Active enabled sections sorted by sort_order
  const sections: FooterSection[] = (settings.footer_sections || [])
    .filter((sec: FooterSection) => sec.enabled)
    .sort((a: FooterSection, b: FooterSection) => a.sort_order - b.sort_order);

  // Active social links
  const socialLinks: FooterSocialLink[] = (settings.footer_social_links || [])
    .filter((s: FooterSocialLink) => s.enabled && s.url)
    .sort((a: FooterSocialLink, b: FooterSocialLink) => a.sort_order - b.sort_order);

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-rose-400" />;
      case 'twitter':
      case 'x':
        return <Twitter className="w-4 h-4 text-sky-400" />;
      case 'github':
        return <Github className="w-4 h-4 text-slate-300" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-400" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-400" />;
      case 'telegram':
        return <Send className="w-4 h-4 text-sky-300" />;
      case 'discord':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-blue-300" />;
      default:
        return <ExternalLink className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleLinkClick = (link: FooterLink) => {
    if (link.url.startsWith('http')) {
      window.open(link.url, link.open_new_tab ? '_blank' : '_self');
    } else {
      navigate(link.url);
    }
  };

  const currentYear = new Date().getFullYear();
  const copyrightNotice = settings.copyright_text || `${footerName}. All rights reserved.`;

  return (
    <footer
      id="app-footer"
      className="w-full bg-[#07080c] border-t border-slate-800/80 mt-auto py-12 text-slate-400 text-xs transition-colors"
      style={{
        backgroundColor: settings.background_color ? `${settings.background_color}` : undefined,
        borderColor: settings.border_color ? `${settings.border_color}` : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
          {/* Brand & Description column */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={footerName}
                  className="h-8 max-w-[160px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: settings.primary_color || '#e11d48' }}
                >
                  <Film className="w-4 h-4" />
                </div>
              )}
              <span className="text-base font-black text-white font-['Cabinet_Grotesk',sans-serif] tracking-tight">
                {footerName}
              </span>
            </div>

            {footerDesc ? (
              <p className="text-slate-400 max-w-sm leading-relaxed text-xs">
                {footerDesc}
              </p>
            ) : null}

            {/* Configurable Status Items */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
              {settings.status_rls_enabled && (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{settings.status_rls_text || 'RLS Enforced'}</span>
                </span>
              )}

              {settings.status_rbac_enabled && (
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-sky-400" />
                  <span>{settings.status_rbac_text || 'Multi-Role RBAC'}</span>
                </span>
              )}

              {settings.status_supabase_enabled && (
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isSupabaseConfigured
                      ? settings.status_supabase_text || 'Supabase Connected'
                      : 'Local Demo Store'}
                  </span>
                </span>
              )}
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                {socialLinks.map((soc) => (
                  <a
                    key={soc.id}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={soc.label}
                    className="w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-center justify-center transition-colors hover:scale-105"
                  >
                    {getSocialIcon(soc.platform)}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Footer Sections */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {sections.map((section) => {
              const enabledLinks = (section.links || [])
                .filter((lnk: FooterLink) => lnk.enabled)
                .sort((a: FooterLink, b: FooterLink) => a.sort_order - b.sort_order);

              return (
                <div key={section.id} className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {section.title}
                  </h4>
                  {enabledLinks.length > 0 ? (
                    <ul className="space-y-2">
                      {enabledLinks.map((link) => (
                        <li key={link.id}>
                          <button
                            onClick={() => handleLinkClick(link)}
                            className="hover:text-white transition-colors text-left flex items-center gap-1.5"
                          >
                            <span>{link.label}</span>
                            {link.url.startsWith('http') && (
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-slate-600 italic">No active links</p>
                  )}
                </div>
              );
            })}

            {/* Optional Contact column if any contact field is filled */}
            {(settings.contact_email || settings.contact_phone || settings.contact_address) && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Contact
                </h4>
                <ul className="space-y-2 text-[11px] text-slate-400">
                  {settings.contact_email && (
                    <li className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <a href={`mailto:${settings.contact_email}`} className="hover:text-white truncate">
                        {settings.contact_email}
                      </a>
                    </li>
                  )}
                  {settings.contact_phone && (
                    <li className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <a href={`tel:${settings.contact_phone}`} className="hover:text-white">
                        {settings.contact_phone}
                      </a>
                    </li>
                  )}
                  {settings.contact_address && (
                    <li className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                      <span>{settings.contact_address}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bottom / Copyright */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>
            © {settings.auto_copyright_year ? `${currentYear} ` : ''}
            {copyrightNotice}
          </p>
          {settings.footer_disclaimer && (
            <p className="text-slate-500 text-center sm:text-right">
              {settings.footer_disclaimer}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};
