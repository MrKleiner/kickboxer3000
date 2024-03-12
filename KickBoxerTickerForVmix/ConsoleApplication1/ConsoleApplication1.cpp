
int main()
{

}

/*
#include <chrono>
#include <iostream>
#include <format>
#include <string>

using namespace std::literals;


int main()
{
    //auto tp = std::chrono::zoned_time{ std::chrono::current_zone(), std::chrono::system_clock::now() }.get_local_time();
    //auto dp = floor<std::chrono::days>(tp);
    //std::chrono::hh_mm_ss timenow{ floor<std::chrono::seconds>(tp) - dp };

    //std::string s = std::format("{:%M:%S}", timenow);
    std::cout << std::format("{:#02}", 5) << '\n';
    std::cout << std::format("{:#02}", 55) << '\n';
    std::cout << std::format("{:#02}", 555) << '\n';
    std::cout << std::format("{:#02}%3A{:#02}", 45, 00) << '\n';


    //    << "%T: " << std::format("{:%S}", timenow) << '\n';
}










#include <string.h>

#pragma warning(disable:4996)     // disable warning/error for obsolete inet_addr function
#pragma comment(lib,"ws2_32.lib") // Winsock Library
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <iostream>
#include <vector>
#include <locale>
#include <sstream>
using namespace std;
#pragma comment(lib,"ws2_32.lib")


string website_HTML;
locale local;
void get_Website(string url);
char buffer[10000];
int i = 0;


//****************************************************

int main(void) {

    get_Website("127.0.0.1:8088/API/"); // 

    cout << website_HTML;

    cout << "\n\nPress ANY key to close.\n\n";
    cin.ignore(); cin.get();


    return 0;
}

//****************************************************

void get_Website(string url) {
    WSADATA wsaData;
    SOCKET Socket;
    SOCKADDR_IN SockAddr;
    int lineCount = 0;
    int rowCount = 0;
    struct hostent* host;
    string get_http;


    get_http = "GET / HTTP/1.1\r\nHost: " + url + "\r\nConnection: close\r\n\r\n";

    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        cout << "WSAStartup failed.\n";
        system("pause");
        //return 1;
    }

    Socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    host = gethostbyname(url.c_str());

    SockAddr.sin_port = htons(8088);
    SockAddr.sin_family = AF_INET;
    // SockAddr.sin_addr.s_addr = *((unsigned long*)host->h_addr);
    SockAddr.sin_addr.S_un.S_addr = inet_addr("127.0.0.1");

    if (connect(Socket, (SOCKADDR*)(&SockAddr), sizeof(SockAddr)) != 0) {
        cout << "Could not connect";
        system("pause");
        //return 1;
    }
    send(Socket, get_http.c_str(), strlen(get_http.c_str()), 0);

    int nDataLength;
    while ((nDataLength = recv(Socket, buffer, 10000, 0)) > 0) {
        int i = 0;
        while (buffer[i] >= 32 || buffer[i] == '\n' || buffer[i] == '\r') {

            website_HTML += buffer[i];
            i += 1;
        }
    }

    closesocket(Socket);
    WSACleanup();

}
*/