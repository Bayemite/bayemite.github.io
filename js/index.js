let navbarOpen = false;

function toggleHamburgerNav() {
    if (navbarOpen === false) {
        // Width may need to change for wider links
        let topnav = document.getElementsByClassName('topnav')[0];
        topnav.style.width = '118px';
        let hamburger = document.getElementById('hamburger');
        hamburger.classList.remove('fa-bars');
        hamburger.classList.add('fa-close');
        navbarOpen = true;
    }
    else {
        document.getElementsByClassName('topnav')[0].style.width = '0';
        let hamburger = document.getElementById('hamburger');
        hamburger.classList.add('fa-bars');
        hamburger.classList.remove('fa-close');
        navbarOpen = false;
    }
}

function main() {
    document.getElementById('hamburger').addEventListener('click', () => toggleHamburgerNav());
    console.log('hi');
}

window.onload = () => main();