/*jshint multistr: true */
//Variable initialization
function AddUser() {}
AddUser.loadingDataTry = 0;
AddUser.loadingDataTryMax = 10;
AddUser.loadingDataTimeout = 3500;
AddUser.UsernameArraySize = 0;
AddUser.UsernameArray = [];
AddUser.UserIdArray = [];
AddUser.Followercount = 0;
AddUser.Username = null;
AddUser.loadingData = false;
AddUser.keyBoardOn = false;
//Variable initialization end

AddUser.init = function() {
    Main.Go = Main.AddUser;
    $('#top_bar_user').removeClass('icon_center_label');
    $('#top_bar_user').addClass('icon_center_focus');
    Main.HideWarningDialog();
    AddUser.input = document.querySelector('#user_input');
    $('.label_placeholder_user').attr("placeholder", STR_PLACEHOLDER_USER);
    AddUser.inputFocus();
    AddUser.ScrollHelper.scrollVerticalToElementById('user_input');
};

AddUser.exit = function() {
    AddUser.RemoveinputFocus();
    document.body.removeEventListener("keydown", AddUser.handleKeyDown);
    $('#top_bar_user').removeClass('icon_center_focus');
    $('#top_bar_user').addClass('icon_center_label');
};

AddUser.handleKeyDown = function(event) {
    if (AddUser.loadingData || AddUser.keyBoardOn) return;

    switch (event.keyCode) {
        case TvKeyCode.KEY_RETURN:
            if (Main.isAboutDialogShown()) Main.HideAboutDialog();
            else if (Main.isControlsDialogShown()) Main.HideControlsDialog();
            else {
                Main.Go = Main.Before;
                AddUser.exit();
                Main.SwitchScreen();
            }
            break;
        case TvKeyCode.KEY_CHANNELUP:
            Main.Go = Main.Games;
            AddUser.exit();
            Main.SwitchScreen();
            break;
        case TvKeyCode.KEY_CHANNELDOWN:
            Main.Go = Main.Live;
            AddUser.exit();
            Main.SwitchScreen();
            break;
        case TvKeyCode.KEY_PLAY:
        case TvKeyCode.KEY_PAUSE:
        case TvKeyCode.KEY_PLAYPAUSE:
        case TvKeyCode.KEY_ENTER:
            AddUser.inputFocus();
            break;
        case TvKeyCode.KEY_RED:
            Main.showAboutDialog();
            break;
        case TvKeyCode.KEY_GREEN:
            AddUser.exit();
            Main.GoLive();
            break;
        case TvKeyCode.KEY_YELLOW:
            Main.showControlsDialog();
            break;
        case TvKeyCode.KEY_BLUE:
            Main.BeforeSearch = Main.Go;
            Main.Go = Main.Search;
            AddUser.exit();
            Main.SwitchScreen();
            break;
        default:
            break;
    }
};

AddUser.inputFocus = function() {
    document.body.removeEventListener("keydown", AddUser.handleKeyDown);
    document.body.addEventListener("keydown", AddUser.KeyboardEvent, false);
    AddUser.input.addEventListener('input');
    AddUser.input.addEventListener('compositionend');
    $('.label_placeholder_user').attr("placeholder", STR_PLACEHOLDER_USER);
    AddUser.input.focus();
    AddUser.keyBoardOn = true;
};

AddUser.RemoveinputFocus = function() {
    AddUser.input.blur();
    document.body.removeEventListener("keydown", AddUser.KeyboardEvent);
    document.body.addEventListener("keydown", AddUser.handleKeyDown, false);
    $('.label_placeholder_user').attr("placeholder", STR_PLACEHOLDER_PRESS + STR_PLACEHOLDER_USER);
    window.setTimeout(function() {
        AddUser.keyBoardOn = false;
    }, 250);
};

AddUser.KeyboardEvent = function(event) {
    if (AddUser.loadingData) return;

    switch (event.keyCode) {
        case TvKeyCode.KEY_KEYBOARD_DELETE_ALL:
            document.getElementById("user_input").value = '';
            event.preventDefault();
            break;
        case TvKeyCode.KEY_KEYBOARD_DONE:
        case TvKeyCode.KEY_KEYBOARD_CANCEL:
            if ($('#user_input').val() !== '' && $('#user_input').val() !== null) {

                document.getElementById("user_input").value = $('#user_input').val();
                AddUser.Username = $('#user_input').val();

                if (!AddUser.UserCodeExist(AddUser.Username)) {
                    AddUser.loadingDataTry = 0;
                    AddUser.loadingDataTimeout = 3500;
                    AddUser.loadingData = true;
                    Main.showLoadDialog();
                    AddUser.ScrollHelper.scrollVerticalToElementById('blank_focus');
                    AddUser.loadDataRequest();
                } else {
                    Main.HideLoadDialog();
                    Main.showWarningDialog(STR_USER + AddUser.Username + STR_USER_SET);
                    window.setTimeout(function() {
                        Main.HideWarningDialog();
                        AddUser.inputFocus();
                    }, 1500);
                }
            }
            AddUser.RemoveinputFocus();
            break;
        case TvKeyCode.KEY_KEYBOARD_BACKSPACE:
            document.getElementById("user_input").value = $('#user_input').val().slice(0, -1);
            event.preventDefault();
            break;
        case TvKeyCode.KEY_KEYBOARD_SPACE:
            document.getElementById("user_input").value = $('#user_input').val() + ' ';
            event.preventDefault();
            break;
        default:
            break;
    }
};

AddUser.loadDataRequest = function() {
    try {

        var xmlHttp = new XMLHttpRequest();

        xmlHttp.open("GET", 'https://api.twitch.tv/kraken/users/' + encodeURIComponent(AddUser.Username) + '/follows/channels?limit=1&sortby=created_at&' + Math.round(Math.random() * 1e7), true);
        xmlHttp.timeout = AddUser.loadingDataTimeout;
        xmlHttp.setRequestHeader('Client-ID', Main.clientId);
        xmlHttp.ontimeout = function() {};

        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 200) {
                    document.getElementById("user_input").value = '';
                    document.body.removeEventListener("keydown", AddUser.handleKeyDown);
                    AddUser.SaveNewUser();
                    return;
                } else {
                    AddUser.loadDataError();
                }
            }
        };

        xmlHttp.send(null);
    } catch (e) {
        AddUser.loadDataError();
    }
};

AddUser.loadDataError = function() {
    AddUser.loadingDataTry++;
    if (AddUser.loadingDataTry < AddUser.loadingDataTryMax) {
        AddUser.loadingDataTimeout += (AddUser.loadingDataTry < 5) ? 250 : 3500;
        AddUser.loadDataRequest();
    } else {
        AddUser.Username = null;
        Main.HideLoadDialog();
        Main.showWarningDialog(STR_USER_ERROR);
        window.setTimeout(function() {
            AddUser.init();
        }, 1000);
        AddUser.loadingData = false;
    }
};

AddUser.RestoreUsers = function() {
    AddUser.UsernameArray = [];
    AddUser.UsernameArraySize = parseInt(localStorage.getItem('UsernameArraySize')) || 0;
    if (AddUser.UsernameArraySize > 0) {
        for (var x = 0; x < AddUser.UsernameArraySize; x++) {
            AddUser.UsernameArray[x] = localStorage.getItem('UsernameArray' + x);
        }

        Main.SmartHubId = window.setInterval(SmartHub.Start, 600000);
        document.addEventListener('visibilitychange', Main.Resume, false);
    }
    window.setTimeout(function() {
        SmartHub.Start();
        window.addEventListener('appcontrol', SmartHub.EventListener, false);
    }, 3500);
    AddCode.RestoreUsers();
};

AddUser.SaveNewUser = function() {
    AddUser.UsernameArray[AddUser.UsernameArraySize] = AddUser.Username;
    localStorage.setItem('UsernameArray' + AddUser.UsernameArraySize, AddUser.Username);
    AddUser.UsernameArraySize++;
    localStorage.setItem('UsernameArraySize', AddUser.UsernameArraySize);
    Users.status = false;
    Users.init();
    AddUser.loadingData = false;

    if (AddUser.UsernameArray.length === 1) {
        window.clearInterval(Main.SmartHubId);
        document.removeEventListener('visibilitychange', Main.Resume);

        Main.SmartHubId = window.setInterval(SmartHub.Start, 600000);
        document.addEventListener('visibilitychange', Main.Resume, false);

        SmartHub.Start();
    }
};

AddUser.removeUser = function(Position) {
    var userCode = AddCode.UserCodeExist(AddUser.UsernameArray[Position]);
    if (userCode > -1) AddCode.removeUser(userCode);

    AddUser.UsernameArraySize--;
    if (AddUser.UsernameArraySize < 0) AddUser.UsernameArraySize = 0;
    localStorage.setItem('UsernameArraySize', AddUser.UsernameArraySize);

    var index = AddUser.UsernameArray.indexOf(AddUser.UsernameArray[Position]);
    if (index > -1) {
        AddUser.UsernameArray.splice(index, 1);
    }

    for (var x = 0; x < AddUser.UsernameArray.length; x++) {
        localStorage.setItem('UsernameArray' + x, AddUser.UsernameArray[x]);
    }
    if (AddUser.UsernameArray.length > 0) {
        Users.status = false;
        Users.init();
        if (Position === 0) SmartHub.Start();
    } else {
        AddUser.init();
        SmartHub.Start();
    }
    AddCode.SetDefaultOAuth(Position);
};

AddUser.UserMakeOne = function(Position) {
    AddUser.Username = AddUser.UsernameArray[0];
    AddUser.UsernameArray[0] = AddUser.UsernameArray[Position];
    AddUser.UsernameArray[Position] = AddUser.Username;
    Users.status = false;
    Users.init();
    SmartHub.Start();
};

AddUser.UserCodeExist = function(user) {
    return AddUser.UsernameArray.indexOf(user) != -1;
};

AddUser.IsUserSet = function() {
    return AddUser.UsernameArray.length > 0;
};

AddUser.ScrollHelper = {
    documentVerticalScrollPosition: function() {
        if (self.pageYOffset) return self.pageYOffset; // Firefox, Chrome, Opera, Safari.
        if (document.documentElement && document.documentElement.scrollTop) return document.documentElement.scrollTop; // Internet Explorer 6 (standards mode).
        if (document.body.scrollTop) return document.body.scrollTop; // Internet Explorer 6, 7 and 8.
        return 0; // None of the above.
    },

    viewportHeight: function() {
        return (document.compatMode === "CSS1Compat") ? document.documentElement.clientHeight : document.body.clientHeight;
    },

    documentHeight: function() {
        return (document.height !== undefined) ? document.height : document.body.offsetHeight;
    },

    documentMaximumScrollPosition: function() {
        return this.documentHeight() - this.viewportHeight();
    },

    elementVerticalClientPositionById: function(id) {
        return document.getElementById(id).getBoundingClientRect().top;
    },

    scrollVerticalToElementById: function(id) {
        if (document.getElementById(id) === null) {
            return;
        }
        $(window).scrollTop(this.documentVerticalScrollPosition() + this.elementVerticalClientPositionById(id) - 0.345 * this.viewportHeight() - 60);
    }
};
