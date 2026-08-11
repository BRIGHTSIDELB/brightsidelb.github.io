        document.addEventListener('DOMContentLoaded', function () {
            var header = document.querySelector('.site-header');
            var siteNav = document.querySelector('.site-nav');
            var menuToggle = document.querySelector('.site-nav__menu-toggle');
            var navLinks = document.querySelectorAll('.site-nav__links a[href^="#"]');
            var copyButtons = document.querySelectorAll('.email-copy-btn[data-copy-email]');
            var scrollButtons = document.querySelectorAll('button[data-scroll-target^="#"]');
            var mobileNavContactButton = document.querySelector('.site-nav__links .email-copy-btn[data-scroll-target="#contact"]');
            var contactSectionCta = document.querySelector('.contact .email-copy-btn[data-copy-email]');
            var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(function (heading) {
                if (!heading.hasAttribute('tabindex')) {
                    heading.setAttribute('tabindex', '0');
                }

                heading.addEventListener('focus', function () {
                    heading.classList.add('is-keyboard-focus');
                });

                heading.addEventListener('blur', function () {
                    heading.classList.remove('is-keyboard-focus');
                });
            });

            var copyTimers = new WeakMap();
            var copyInteractionModes = new WeakMap();
            var contactCtaPreviewTimer = null;

            function setCopyInteractionMode(button, mode) {
                if (mode) {
                    copyInteractionModes.set(button, mode);
                } else {
                    copyInteractionModes.delete(button);
                }
            }

            function getCopyInteractionMode(button) {
                return copyInteractionModes.get(button);
            }

            function getHeaderOffset() {
                if (!header) {
                    return 0;
                }

                return Math.ceil(header.getBoundingClientRect().height) + 12;
            }

            function closeMenu() {
                if (!siteNav || !menuToggle) {
                    return;
                }

                siteNav.classList.remove('is-open');
                document.body.classList.remove('menu-open');
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.setAttribute('aria-label', 'Open menu');
            }

            function openMenu() {
                if (!siteNav || !menuToggle) {
                    return;
                }

                siteNav.classList.add('is-open');
                document.body.classList.add('menu-open');
                menuToggle.setAttribute('aria-expanded', 'true');
                menuToggle.setAttribute('aria-label', 'Close menu');
            }

            function toggleMenu() {
                if (!siteNav || !menuToggle) {
                    return;
                }

                if (siteNav.classList.contains('is-open')) {
                    closeMenu();
                } else {
                    openMenu();
                }
            }

            function scrollToTarget(hash) {
                var target = document.querySelector(hash);

                if (!target) {
                    return;
                }

                var top = window.scrollY + target.getBoundingClientRect().top - getHeaderOffset();
                window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
                if (history.pushState) {
                    history.pushState(null, '', hash);
                }
            }

            function copyEmailToClipboard(email) {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    return navigator.clipboard.writeText(email);
                }

                var fallbackInput = document.createElement('textarea');
                fallbackInput.value = email;
                fallbackInput.setAttribute('readonly', '');
                fallbackInput.style.position = 'fixed';
                fallbackInput.style.top = '-9999px';
                fallbackInput.style.left = '-9999px';
                document.body.appendChild(fallbackInput);
                fallbackInput.select();
                fallbackInput.setSelectionRange(0, fallbackInput.value.length);

                try {
                    document.execCommand('copy');
                } finally {
                    document.body.removeChild(fallbackInput);
                }

                return Promise.resolve();
            }

            function clearCopyState(button) {
                button.removeAttribute('data-copy-state');
                button.removeAttribute('data-copy-preview');
                button.removeAttribute('data-copy-touch');
            }

            function clearCopyTimer(button) {
                var existingTimer = copyTimers.get(button);

                if (existingTimer) {
                    window.clearTimeout(existingTimer);
                    copyTimers.delete(button);
                }
            }

            function showCopySuccess(button, isTouchInteraction) {
                clearCopyTimer(button);
                button.setAttribute('data-copy-state', 'copied');

                if (isTouchInteraction) {
                    button.setAttribute('data-copy-touch', 'true');
                } else {
                    button.removeAttribute('data-copy-touch');
                }

                var resetTimer = window.setTimeout(function () {
                    clearCopyState(button);
                    copyTimers.delete(button);
                }, 1800);
                copyTimers.set(button, resetTimer);
            }

            function handleCopyButton(button, event) {
                var email = button.getAttribute('data-copy-email');

                if (!email) {
                    return;
                }

                clearCopyTimer(button);
                if (event && event.type === 'pointerdown') {
                    setCopyInteractionMode(button, event.pointerType || 'mouse');
                }

                copyEmailToClipboard(email).then(function () {
                    if (button === contactSectionCta) {
                        button.setAttribute('data-copy-preview', 'true');
                        if (contactCtaPreviewTimer) {
                            window.clearTimeout(contactCtaPreviewTimer);
                        }
                        contactCtaPreviewTimer = window.setTimeout(function () {
                            button.removeAttribute('data-copy-preview');
                        }, 1800);
                    } else {
                        showCopySuccess(button, getCopyInteractionMode(button) === 'touch');
                    }
                });
            }

            if (menuToggle) {
                menuToggle.addEventListener('click', toggleMenu);
            }

            navLinks.forEach(function (link) {
                link.addEventListener('click', function () {
                    closeMenu();
                });
            });

            scrollButtons.forEach(function (button) {
                button.addEventListener('click', function () {
                    var target = button.getAttribute('data-scroll-target');

                    if (target) {
                        scrollToTarget(target);
                    }
                });
            });

            if (mobileNavContactButton) {
                mobileNavContactButton.addEventListener('click', function () {
                    closeMenu();
                });
            }

            copyButtons.forEach(function (button) {
                button.addEventListener('pointerdown', function (event) {
                    setCopyInteractionMode(button, event.pointerType || 'mouse');
                });
                button.addEventListener('click', function (event) {
                    event.preventDefault();
                    handleCopyButton(button, event);
                });
            });

            if (contactSectionCta) {
                contactSectionCta.addEventListener('click', function (event) {
                    event.preventDefault();
                    handleCopyButton(contactSectionCta, event);
                });
            }

            window.addEventListener('resize', function () {
                if (window.innerWidth > 1070) {
                    closeMenu();
                }
            });

            window.addEventListener('beforeunload', function () {
                copyButtons.forEach(function (button) {
                    clearCopyTimer(button);
                });
                if (contactCtaPreviewTimer) {
                    window.clearTimeout(contactCtaPreviewTimer);
                }
            });
        });
