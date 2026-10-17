"use client";

import { useState } from "react";

type AccountSwitcherProps = { name: string; username: string; email: string };

export default function AccountSwitcher({ name, username, email }: AccountSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="account-switcher">
        <button className="account-switcher-trigger" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <span className="profile-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
          <span className="account-switcher-summary"><strong>{name}</strong><small>@{username}</small></span>
          <span className="account-switcher-chevron" aria-hidden="true">⌄</span>
        </button>
        {open && (
          <div className="account-switcher-menu" role="menu">
            <p className="account-switcher-heading">Available accounts</p>
            <div className="account-switcher-account" role="menuitem" aria-current="true">
              <span className="profile-avatar profile-avatar-small" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
              <span><strong>{name}</strong><small>@{username} · {email}</small></span>
              <span className="account-switcher-current">Current</span>
            </div>
            <button className="account-switcher-add" type="button" onClick={() => { setOpen(false); setModalOpen(true); }}>＋ Add account</button>
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="account-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setModalOpen(false); }}>
          <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
            <button className="account-modal-close" type="button" aria-label="Close account dialog" onClick={() => setModalOpen(false)}>×</button>
            <p className="micro">Account switcher</p>
            <h2 id="account-modal-title">Add an account.</h2>
            <p>Use the same secure email-first flow to sign in to another account or create a new one.</p>
            <div className="account-modal-actions">
              <a className="auth-button" href="/?intent=login">Log in to an account ↗</a>
              <a className="auth-button secondary" href="/?intent=signup">Create a new account ↗</a>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
