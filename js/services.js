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
            var contactCtaVisibilityObserver = null;
            var contactCtaVisibilityTimeout = null;

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

                var headerOffset = getHeaderOffset();
                var top = window.scrollY + target.getBoundingClientRect().top - headerOffset;
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

                try {
                    document.execCommand('copy');
                    document.body.removeChild(fallbackInput);
                    return Promise.resolve();
                } catch (error) {
                    document.body.removeChild(fallbackInput);
                    return Promise.reject(error);
                }
            }

            function setCopyState(button, state) {
                var timer = copyTimers.get(button);

                if (timer) {
                    window.clearTimeout(timer);
                    copyTimers.delete(button);
                }

                if (state) {
                    button.setAttribute('data-copy-state', state);
                } else {
                    button.removeAttribute('data-copy-state');
                    button.removeAttribute('data-copy-touch');
                }

                if (state === 'copied') {
                    copyTimers.set(button, window.setTimeout(function () {
                        button.removeAttribute('data-copy-state');
                        button.removeAttribute('data-copy-touch');
                        copyTimers.delete(button);
                    }, 2500));
                }
            }

            function applyCopyFeedback(button, interactionMode) {
                if (interactionMode === 'touch') {
                    button.setAttribute('data-copy-touch', 'true');
                } else {
                    button.removeAttribute('data-copy-touch');
                }

                setCopyState(button, 'copied');
            }

            function clearContactCtaPreview() {
                if (contactCtaPreviewTimer) {
                    window.clearTimeout(contactCtaPreviewTimer);
                    contactCtaPreviewTimer = null;
                }

                if (contactSectionCta) {
                    contactSectionCta.removeAttribute('data-copy-preview');
                }
            }

            function clearContactCtaVisibilityWatcher() {
                if (contactCtaVisibilityObserver) {
                    contactCtaVisibilityObserver.disconnect();
                    contactCtaVisibilityObserver = null;
                }

                if (contactCtaVisibilityTimeout) {
                    window.clearTimeout(contactCtaVisibilityTimeout);
                    contactCtaVisibilityTimeout = null;
                }
            }

            function isContactCtaInView() {
                if (!contactSectionCta) {
                    return false;
                }

                var rect = contactSectionCta.getBoundingClientRect();
                var headerOffset = getHeaderOffset();
                var viewportHeight = window.innerHeight || document.documentElement.clientHeight;

                return rect.bottom > headerOffset && rect.top < viewportHeight;
            }

            function showContactCtaPreview() {
                if (!contactSectionCta) {
                    return;
                }

                clearContactCtaPreview();
                contactSectionCta.setAttribute('data-copy-preview', 'true');

                contactCtaPreviewTimer = window.setTimeout(function () {
                    clearContactCtaPreview();
                }, 2800);
            }

            function showContactCtaCopiedFromNav() {
                if (!contactSectionCta) {
                    return;
                }

                clearContactCtaVisibilityWatcher();
                clearContactCtaPreview();
                setCopyInteractionMode(contactSectionCta, 'mouse');
                applyCopyFeedback(contactSectionCta, 'mouse');
                setCopyInteractionMode(contactSectionCta, null);
            }

            function showContactCtaCopiedWhenInView() {
                if (!contactSectionCta) {
                    return;
                }

                clearContactCtaVisibilityWatcher();

                if (isContactCtaInView()) {
                    showContactCtaCopiedFromNav();
                    return;
                }

                if ('IntersectionObserver' in window) {
                    contactCtaVisibilityObserver = new IntersectionObserver(function (entries) {
                        entries.forEach(function (entry) {
                            if (entry.isIntersecting) {
                                showContactCtaCopiedFromNav();
                            }
                        });
                    }, {
                        threshold: 0.35,
                        rootMargin: '-' + getHeaderOffset() + 'px 0px 0px 0px'
                    });

                    contactCtaVisibilityObserver.observe(contactSectionCta);
                }

                contactCtaVisibilityTimeout = window.setTimeout(function () {
                    clearContactCtaVisibilityWatcher();

                    if (isContactCtaInView()) {
                        showContactCtaCopiedFromNav();
                    }
                }, 1800);
            }

            var skipLink = document.querySelector('.skip-link');
            var mainContent = document.getElementById('main-content');

            if (skipLink && mainContent) {
                function activateSkip(event) {
                    event.preventDefault();
                    mainContent.focus({ preventScroll: true });
                    mainContent.scrollIntoView({ block: 'start' });
                }

                skipLink.addEventListener('click', activateSkip);
                skipLink.addEventListener('keydown', function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        activateSkip(event);
                    }
                });
            }

            if (menuToggle && siteNav) {
                menuToggle.addEventListener('click', toggleMenu);
            }

            copyButtons.forEach(function (button) {
                var email = button.getAttribute('data-copy-email');

                if (!email) {
                    return;
                }

                button.addEventListener('pointerdown', function (event) {
                    setCopyInteractionMode(button, event.pointerType === 'touch' ? 'touch' : 'mouse');

                    if (event.pointerType === 'touch') {
                        button.setAttribute('data-copy-touch', 'true');
                    }
                });

                button.addEventListener('touchstart', function () {
                    setCopyInteractionMode(button, 'touch');
                    button.setAttribute('data-copy-touch', 'true');
                }, { passive: true });

                button.addEventListener('keydown', function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        setCopyInteractionMode(button, 'keyboard');
                    }
                });

                button.addEventListener('click', function () {
                    var interactionMode = getCopyInteractionMode(button);

                    if (button === contactSectionCta) {
                        clearContactCtaPreview();
                    }

                    copyEmailToClipboard(email).then(function () {
                        applyCopyFeedback(button, interactionMode);
                    }).catch(function () {
                        applyCopyFeedback(button, interactionMode);
                    }).finally(function () {
                        setCopyInteractionMode(button, null);
                    });
                });
            });

            navLinks.forEach(function (link) {
                link.addEventListener('click', function (event) {
                    var hash = link.getAttribute('href');

                    if (!hash || hash.charAt(0) !== '#') {
                        return;
                    }

                    event.preventDefault();
                    closeMenu();
                    scrollToTarget(hash);
                });
            });

            scrollButtons.forEach(function (button) {
                button.addEventListener('click', function () {
                    var targetHash = button.getAttribute('data-scroll-target');

                    if (!targetHash || targetHash.charAt(0) !== '#') {
                        return;
                    }

                    var shouldPreviewContactCta = (
                        button === mobileNavContactButton &&
                        targetHash === '#contact' &&
                        window.matchMedia('(max-width: 1070px)').matches
                    );

                    if (shouldPreviewContactCta) {
                        window.setTimeout(showContactCtaPreview, 420);
                    } else {
                        clearContactCtaPreview();

                        if (
                            button === mobileNavContactButton &&
                            targetHash === '#contact' &&
                            window.matchMedia('(min-width: 1071px)').matches
                        ) {
                            showContactCtaCopiedWhenInView();
                        }
                    }

                    closeMenu();
                    scrollToTarget(targetHash);
                });
            });

            if (contactSectionCta) {
                contactSectionCta.addEventListener('pointerdown', function () {
                    clearContactCtaVisibilityWatcher();
                    clearContactCtaPreview();
                });

                contactSectionCta.addEventListener('focus', function () {
                    clearContactCtaVisibilityWatcher();
                    clearContactCtaPreview();
                });

                contactSectionCta.addEventListener('mouseenter', function () {
                    clearContactCtaVisibilityWatcher();
                    clearContactCtaPreview();
                });
            }

            document.addEventListener('pointerdown', function (event) {
                if (!contactSectionCta || !contactSectionCta.hasAttribute('data-copy-preview')) {
                    return;
                }

                if (!contactSectionCta.contains(event.target)) {
                    clearContactCtaPreview();
                }
            });

            document.addEventListener('focusin', function (event) {
                if (!contactSectionCta || !contactSectionCta.hasAttribute('data-copy-preview')) {
                    return;
                }

                if (!contactSectionCta.contains(event.target)) {
                    clearContactCtaPreview();
                }
            });

            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    closeMenu();
                }
            });

            window.addEventListener('resize', function () {
                if (window.innerWidth > 720) {
                    closeMenu();
                }
            });

            window.addEventListener('scroll', function () {
                if (!contactSectionCta || !contactCtaVisibilityObserver) {
                    return;
                }

                if (isContactCtaInView()) {
                    showContactCtaCopiedFromNav();
                }
            }, { passive: true });

            if (window.location.hash) {
                window.requestAnimationFrame(function () {
                    scrollToTarget(window.location.hash);
                });
            }
        });
