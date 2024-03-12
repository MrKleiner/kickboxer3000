#include <stdlib.h>
#include "KbUDPserverClass.h"

#pragma warning(disable:4996)     // disable warning/error for obsolete inet_addr function
#pragma comment(lib,"ws2_32.lib") // Winsock Library
#include <winsock2.h>


WSADATA wsa_data;
uint16_t udp_port_to_bind_to = 9999;

int main(int argc, char* argv[]) {
    system("title start UDP listener.     Build date: "  __DATE__ ".     Build time: " __TIME__ ".");

    // command line args processing
    {
        if (argc != 2) {
            cout << "Usage:\n";
            cout << "    KbUDPserver port(to bind to)\n\n";
            cout << "Example:\n";
            cout << "    KbUDPserver " << udp_port_to_bind_to << "\n\n";
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
    printf("Initialising Winsock... ");
    if (WSAStartup(MAKEWORD(2, 2), &wsa_data) != 0) {
        printf("Failed. Error Code: %d", WSAGetLastError());
        exit(0);
    }
    printf("Initialised.\n");

    cout <<"port to bind to: "<< udp_port_to_bind_to << "\n";
    KbUDPServerClass kbUdpServer(udp_port_to_bind_to);
    kbUdpServer.startCharCodesUdpListener();


    WSACleanup();
}