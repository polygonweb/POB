/**
 * Объект UIAPP для добавления модулей по шаблону "Медиатор (наблюдатель)"
 *
 * http://arguments.callee.info/2009/05/18/javascript-design-patterns--mediator/
 */

var UIAPP = (function() {

    /**
     * хранилише с модулями
     */
    var components = {};


    /**
     * функция для оповещения модулей о событии
     */
    var notify = function(event, args, source) {
        if (!event) {
            return;
        }
        args = args || [];
        for (var c in components) {
            if (typeof components[c]['on' + event] === 'function') {
                try {
                    source = source || components[c];
                    components[c]['on' + event].apply(source, args);
                } catch (err) {
                    console.log('Error: ' + err);
                }
            }
        }
    };


    /**
     * функция для добавления модулей в хранилище
     */
    var addComponent = function(name, component, replaceDuplicate) {
        if (name in components) {
            if (replaceDuplicate) {
                removeComponent(name);
            } else {
                throw new Error('Mediator name conflict: ' + name);
            }
        }
        components[name] = component();
    };


    /**
     * функция для удаления модулей из хранилища
     */
    var removeComponent = function(name) {
        if (name in components) {
            delete components[name];
        }
    };


    /**
     * функция для получения модуля из хранилища
     * вернет undefined, если копмонент не был добавлен
     */
    var getComponent = function(name) {
        return components[name];
    };


    /**
     * функция для проверки наличия модуля в хранилище
     * вернет undefined, если компонент не был добавлен
     */
    var contains = function(name) {
        return (name in components);
    };

    return {
        notify  : notify,
        add     : addComponent,
        remove  : removeComponent,
        get     : getComponent,
        has     : contains
    };

})();


/**
 * Утилиты
 */
UIAPP.add('utils', function () {

    return {

        /* задержка выполнения функции debounce */
        /* http://davidwalsh.name/javascript-debounce-function */
        debounce: function(func, wait, immediate) {
            var timeout;
            return function() {
                var context = this, args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        },

        /* вычисление размера полосы прокрутки*/
        getScrollBarSize: function () {
            var div = document.createElement('div');
            div.style.overflowY = 'scroll';
            div.style.width = '99px';
            div.style.height = '99px';
            div.style.padding = '0';
            div.style.border = '0';
            div.style.visibility = 'hidden';

            document.body.appendChild(div);
            var scrollWidth = div.offsetWidth - div.clientWidth;
            document.body.removeChild(div);

            return scrollWidth;
        }

    };

});




/**
 * Стилизация скролла
 *
 * в первую очередь, для меню, где системный толстый скроллбар не удобен
 */
UIAPP.add('styleScroll', function () {

    var selector = '.style-scroll',
        list,
        len,
        isScrollLib, // для проверки, есть ли библиотека для стилизации скролла
        utils = UIAPP.get('utils');

    var init = function () {
        isScrollLib = (typeof Ps === 'object') || false;
        list = document.querySelectorAll(selector);
        len = list.length || 0;
        if (len && isScrollLib) {
            for (var i = 0; i < len; i += 1) {
                Ps.initialize(list[i]);
            };
        };
    };

    var update = function () {
        if (len && isScrollLib) {
            for (var i = 0; i < len; i += 1) {
                Ps.update(list[i]);
            };
        };
    };

    return {
        'onInit': init,
        'onWindow:resize': utils.debounce(update, 200)
    }
});




/**
 * Сворачивание основной контентной части
 */
UIAPP.add('sidebarCollapse', function () {

    var btnSelector = '#sideCollapseBtnId',
        pageSelector = '.page',
        toggleClass = 'page_collapse',
        btn,
        page,
        resize = UIAPP.get('utils').debounce(function () {
            UIAPP.notify('Window:resize');
        }, 500);

    var init = function () {
        btn = document.querySelector(btnSelector);
        page = document.querySelector(pageSelector);

        if (page && btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                page.classList.toggle(toggleClass);
                resize();
            });
        };
    };

    return {
        'onInit': init,
    };
});




/**
 * Работа дополнительного бокового меню
 */
UIAPP.add('sideMenu', function () {

    var itemClass= 'side-list__item_has-sub-menu',
        menuClass = 'side-menu',
        openMenuClass = 'side-menu_open',
        backLinkClass = 'side-menu__back-link',
        scrollItems,
        utils = UIAPP.get('utils');


    /**
     * Вычисление необходимой высоты для контента меню
     */
    var calc = function () {
        var item,
            parent,
            offset,
            h;

        if (scrollItems.length) {
            for(var i = 0; i < scrollItems.length; i += 1) {
                item = scrollItems[i];
                parent = item.closest('.side-menu');
                offset = item.getBoundingClientRect().top;
                h = parent.offsetHeight - offset;
                item.style.maxHeight = h + 'px';
            }
        }
    };


    /**
     * Вешаем обработчики для навигации по меню
     */
    var init = function () {

        scrollItems = document.querySelectorAll('.side-menu__body');
        calc();

        document.addEventListener('click', function (e) {
            var self = e.target,
                parent,
                menu;

            if(self.classList.contains(backLinkClass)) {
                menu = self.closest('.side-menu');
                menu && menu.classList.remove(openMenuClass);
                e.preventDefault();
                return;
            }

            parent = self.closest('.' + itemClass);
            if (parent) {
                menu = parent && parent.querySelector('.' + menuClass);
                menu && menu.classList.add(openMenuClass);
                e.preventDefault();
                return;
            };

        });

    };


    return {
        'onInit': init,
        'onWindow:resize': utils.debounce(calc, 200)
    };

});




/**
 * Таблиц
 */
UIAPP.add('dataTables', function () {

    var tablesArray = [],
        utils = UIAPP.get('utils');

    var init = function () {
        var tables = document.querySelectorAll('.table-wrap');
        if (tables.length) {
            for (var i = 0, len = tables.length; i < len; i+=1) {
                tablesArray.push({
                    wrap: tables[i],
                    head: tables[i].querySelector('.table-wrap__head'),
                    body: tables[i].querySelector('.table-wrap__body')
                });
            };
        };
        calc();
        computePadding();
    };

    /* задание padding для шапки таблицы для компенсации прокрутки */
    var computePadding = function () {
        var scrollBarSize = utils.getScrollBarSize(),
            head = document.documentElement.firstChild,
            style = document.createElement('style');

            style.textContent = '.table-wrap__head { padding-right: ' + scrollBarSize + 'px }';
            head.appendChild(style);
    };

    /* Растяжение тела таблиц для прокрутки */
    var calc = function () {
        var len = tablesArray.length,
            i;

        if (len > 0) {
             for (i = 0; i < len; i+=1) {
                var item = tablesArray[i];
                item.body.style.maxHeight = item.wrap.offsetHeight - item.head.offsetHeight + 'px';
             };
        };
    };

    return {
        'onInit': init,
        'onWindow:resize': utils.debounce(calc, 200)
    };

});



/**
 * Выезжающие панели
 */
UIAPP.add('sidePanels', function () {

    var overlay;

    var closePanel = function (panelElem) {
        panelElem.classList.remove('panel_side_open');
        overlay && overlay.classList.remove('overlay_show');
    };

    var openPanel = function (panelElem) {
        panelElem.classList.add('panel_side_open');
        overlay && overlay.classList.add('overlay_show');
    };

    var init = function () {

        overlay = document.querySelector('.overlay');

        document.addEventListener('click', function (e) {
            var target = e.target;
            if (target.classList.contains('panel__close')) {
                closePanel(target.closest('.panel'));
            };
        }, false);


        overlay && overlay.addEventListener('click', function () {
            var panel = document.querySelector('.panel_side_open');
            panel && closePanel(panel);
        });


        document.addEventListener('click', function (e) {
            var target = e.target.closest('[data-panel-target]'),
                attribute,
                panel;

            if (target) {
                attribute = target.getAttribute('data-panel-target');
                panel = document.querySelector(attribute);
                openPanel(panel);
            };
        }, false);
    };

    return {
        'onInit': init
    }
});




/**
 * Выпадающие панели поиска
 */
UIAPP.add('searchTool', function () {

    var btnClass = 'search-tool__btn',
        toolClass = 'search-tool',
        toolActiveClass = 'search-tool_active',
        tools,
        len;

    var init = function () {

        tools = Array.prototype.slice.call(document.querySelectorAll('.' + toolClass));
        len = tools.length;

        document.addEventListener('click', function (e) {
            var target = e.target,
                tool,
                index;

            if (target.classList.contains(btnClass)) {
                e.stopPropagation();

                tool = target.closest('.' + toolClass);
                if (tool) {
                    index = tools.indexOf(index);
                    tool && tool.classList.toggle(toolActiveClass);
                    for(var i = 0; i < len; i += 1) {
                        if (tool !== tools[i]) {
                            tools[i].classList.remove(toolActiveClass);
                        }
                    }
                }
            };
        });

        // если клик был не на панели, закрываем все окна с поиском
        document.addEventListener('click', function (e) {
                i;

            if (e.target.closest('.' + toolClass) !== null) {
                // console.log('yes');
                return false;
            };

            for(var i = 0; i < len; i += 1) {
                tools[i].classList.remove(toolActiveClass);
            };
        });
    };

    return {
        'onInit': init
    }

});




/**
 * Выпадающие списки
 */
UIAPP.add('dropdown', function () {

    var selector = '.chosen';

    var init = function () {
        var $selects = $(selector);
        if($selects.length > 0) {
            $selects.chosen();
        }
    };

    return {
        'onInit': init
    }
});




/**
 * Стартовая точка
 */
document.addEventListener('DOMContentLoaded', function () {
    UIAPP.notify('Init');
});

window.addEventListener('resize', function () {
    UIAPP.notify('Window:resize');
});
