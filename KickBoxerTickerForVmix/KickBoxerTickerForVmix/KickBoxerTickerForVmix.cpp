#pragma warning(disable:4996)     // disable warning/error for obsolete inet_addr function (winsock2)
#pragma comment(lib,"ws2_32.lib") // Winsock Library
#include <winsock2.h>
#include <stdio.h>
#include <cstdint>
#include <iostream>
#include <string>
#include <windows.h>
#include "KbUDPserverClass.h"
#include "KickBoxerTickerForVmix.h"


using namespace std;


WSADATA wsa_data; // winsock
uint16_t udp_port_to_bind_to = 8888;


int main(int argc, char* argv[])
{
    // Console window set-up
    // (set window title, disable cursor, disable mouse select, disable manual scroll - otherwise code execution in the console is suspended)
    {
        // Set window width
        system("mode con: cols=140 lines=25");

        // Window title
        system("title KickBoxer3000 ticker for vMix. version " PROGRAM_VERSION ".    Build date: "  __DATE__ ".     Build time: " __TIME__ ".");

        // disable mouse selection inside the window (due to code execution will be suspended in this console during mouse selection)
        DWORD prev_mode = 0;
        bool res = GetConsoleMode(GetStdHandle(STD_INPUT_HANDLE), &prev_mode);
        SetConsoleMode(GetStdHandle(STD_INPUT_HANDLE), ENABLE_EXTENDED_FLAGS | (prev_mode & ~ENABLE_QUICK_EDIT_MODE));

        // disable window resize for disabling scroll (manual scroll suspends code execution in this console)
        HWND consoleWindow = GetConsoleWindow();
        SetWindowLong(consoleWindow, GWL_STYLE, GetWindowLong(consoleWindow, GWL_STYLE) & ~WS_MAXIMIZEBOX & ~WS_SIZEBOX);

        // disable cursor escape sequence
        cout << "\033[?25l";
    }


    // command line args processing
    {
        std::cout << "KickBoxer3000 ticker for vMix (udp listener). Version " << PROGRAM_VERSION << ".\n\n";
        if (argc != 2) {
            cout << "Usage:\n";
            cout << "    kbUDPclient port(to bind to)\n\n";
            cout << "Example:\n";
            cout << "    kbUDPclient " << udp_port_to_bind_to << "\n\n";
            cout << "Default port:\n";
            cout << "    " << udp_port_to_bind_to << "\n\n";
        }
        else {
            uint16_t argv_port;
            try {
                argv_port = stoi(argv[1]);
                udp_port_to_bind_to = argv_port;
            }
            catch (...) {
                cout << "Wrong port number. Exiting...\n"; exit(1);
            }
        }
        cout << "UDP port for binding attempt:\n";
        cout << "    " << udp_port_to_bind_to << "\n\n";
    }


    // initialise winsock2
    {
        printf("Initialising Winsock... ");
        if (WSAStartup(MAKEWORD(2, 2), &wsa_data) != 0) {
            printf("Failed. Error Code: %d", WSAGetLastError());
            exit(0);
        }
        printf("Initialised.\n");
    }


	KbUDPServerClass kbUdpServer(udp_port_to_bind_to);
    kbUdpServer.startUdpListenerForVmixTiming();
    

    WSACleanup();

}
