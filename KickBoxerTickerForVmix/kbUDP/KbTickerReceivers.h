#pragma once

#include <vector>
#include <iostream>
#include <memory>
#include <string>
#include <format>

#pragma comment(lib,"ws2_32.lib") // Winsock Library
#pragma warning(disable:4996)     // disable warning/error for deprecated inet_addr function
#include <winsock2.h>

#include "KbUdpPacketHeaders.h"


using namespace std;

/**
 * @brief KbTickerReceiverBaseType
 */
class KbTickerReceiverBaseType {
private:
    uint8_t ipaddr_[4];
    uint16_t PORT_;
    string path_;

public:
    KbTickerReceiverBaseType(uint8_t ipaddr[4], uint16_t PORT, string path = "") {
        memcpy_s(&ipaddr_, sizeof(ipaddr_), ipaddr, sizeof(ipaddr_));
        PORT_ = PORT;
        path_ = path;
    }

    string path() { return path_; }


    bool receiverExist(uint8_t ipaddr[4], uint16_t PORT, string path = "") const {
        return memcmp(ipaddr, ipaddr_, sizeof(ipaddr_)) == 0 && PORT == PORT_ && path.compare(path_) == 0;
    }

    virtual void sendPacketMMSS(uint8_t mm, uint8_t ss, uint8_t timer_no = 0) = 0;

    virtual ~KbTickerReceiverBaseType() = default;
};


class KbTickerUdpReceiver : public KbTickerReceiverBaseType {

private:
    SOCKET client_socket = {};
    sockaddr_in server = {};
    SendTimerUdpPacketHeader udp_pkt_buf;

public:
    KbTickerUdpReceiver(uint8_t ipaddr[4], uint16_t PORT, string path = "") : KbTickerReceiverBaseType(ipaddr, PORT, path) {
        // create socket
        if ((client_socket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)) == SOCKET_ERROR) {
            // socket cannot be created
            printf("socket() failed with error code: %d", WSAGetLastError());
            // exit(EXIT_FAILURE);
        } else {
            // Set timeout for recvfrom()
            DWORD recvfrom_timeout = 1 * 700;
            setsockopt(client_socket, SOL_SOCKET, SO_RCVTIMEO, (const char*)&recvfrom_timeout, sizeof(recvfrom_timeout));

            // setup address structure
            memset((char*)&server, 0, sizeof(server));
            server.sin_family = AF_INET;
            server.sin_port = htons(PORT);
            char ipaddr_buf[99];
            int strlen = snprintf(ipaddr_buf, sizeof(ipaddr_buf), "%d.%d.%d.%d", ipaddr[0], ipaddr[1], ipaddr[2], ipaddr[3]);
            // ipaddr conversion error processing - not implmented yet if (strlen>0) {} else {       // error   }
            server.sin_addr.S_un.S_addr = inet_addr(ipaddr_buf); //  TODO: No inet_addr errors processing
        }
    }

    void sendPacketMMSS(uint8_t mm, uint8_t ss, uint8_t timer_no = 0) override {
        udp_pkt_buf = { .timer_no = timer_no, .minutes = mm, .seconds = ss };
        if (sendto(client_socket, (char*)&udp_pkt_buf, sizeof(udp_pkt_buf), 0, (sockaddr*)&server, sizeof(sockaddr_in)) == SOCKET_ERROR) {
            printf("sendto() failed with error code: %d", WSAGetLastError());
            return; //  exit(EXIT_FAILURE);
        }
    }
};


class KbTickerHttpReceiver : public KbTickerReceiverBaseType {

public:
    SOCKET Socket;
    SOCKADDR_IN SockAddr;
    // struct hostent* host;
    string get_http_begin;
    string get_http_end;

    /**
     * @brief url format:
     * "/API/?Function=SetText&Input=TextHD.xaml&SelectedName=Message&Value="
     * @param ipaddr
     * @param PORT
     * @param url
     */
    KbTickerHttpReceiver(uint8_t ipaddr[4], uint16_t PORT, string path) : KbTickerReceiverBaseType(ipaddr, PORT, path) {
        // string url = "/API/?Function=SetText&Input=TextHD.xaml&SelectedName=Message&Value=" + timenow; // http://
        get_http_begin = "GET " + path;
        char ipaddr_buf[99];
        int strlen = snprintf(ipaddr_buf, sizeof(ipaddr_buf), "%d.%d.%d.%d", ipaddr[0], ipaddr[1], ipaddr[2], ipaddr[3]);
        get_http_end = ipaddr_buf;
        get_http_end = " HTTP/1.1\r\nHost: " + get_http_end + ":" + to_string(PORT) + "\r\nConnection: close\r\n\r\n";

        Socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        //host = gethostbyname(path.c_str());

        SockAddr.sin_port = htons(8088); //
        SockAddr.sin_family = AF_INET;
        SockAddr.sin_addr.S_un.S_addr = inet_addr("127.0.0.1"); //
    }

    void sendPacketMMSS(uint8_t mm, uint8_t ss, uint8_t timer_no = 0) override { // const
        string timenow = std::format("{:#02}%3A{:#02}", mm, ss);
        Socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (connect(Socket, (SOCKADDR*)(&SockAddr), sizeof(SockAddr)) != 0) {
            cout << "\rERROR: Could not connect to vmix api";
        }
        else {
            string get_http = get_http_begin + timenow + get_http_end;
            send(Socket, get_http.c_str(), strlen(get_http.c_str()), 0);
            //closesocket(Socket);
            /* int nDataLength;
                string website_HTML;
                char buffer[100000];
                while ((nDataLength = recv(Socket, buffer, 100000, 0)) > 0) {
                    int i = 0;
                    while (buffer[i] >= 32 || buffer[i] == '\n' || buffer[i] == '\r') {

                    website_HTML += buffer[i];
                    i += 1;
                }
            }*/

        }

    }
};




/**
 * @brief KbTickerReceivers - container for <vector> with tcp and udp ticker receivers.
 * 
 */
class KbTickerReceivers
{

public:
    /**
     * @brief <vector> (storage for receivers)
     *
     */
    vector<std::unique_ptr<KbTickerReceiverBaseType>> ticker_receivers;

    void clearAllReceivers() {
        ticker_receivers.clear();
    }

    void clearAllUDPreceivers() {
        for (int i = ticker_receivers.size(); i-- > 0; ) 
            if (ticker_receivers[i]->path() == "") ticker_receivers.erase(ticker_receivers.begin()+i);
    }


    /**
     * Input parameters will be checked to see if a receiver with exactly the same parameters exists (ipaddr, port).
     * If exist - new receiver will be silently ignored.
     * 
     */
    void addUdpReceiver(uint8_t ipaddr[4], uint16_t PORT) {
        for (const auto& obj : ticker_receivers)
            if ( obj->receiverExist(ipaddr, PORT, "") ) return;
        ticker_receivers.push_back(std::make_unique<KbTickerUdpReceiver>(ipaddr, PORT));
        cout << "\nTicker receiver added. ticker_receivers.size() = " << ticker_receivers.size() << "\n";
    }

    /**
     * @brief Input params will be checked against an existing receivers with exactly the same params (ipaddr, port, path).
     * If exist - new receiver will be silently ignored.
     */
    void addHttpReceiver(uint8_t ipaddr[4], uint16_t PORT, string path) {
        for (const auto& obj : ticker_receivers)
            if ( obj->receiverExist(ipaddr, PORT, path) ) return;
        ticker_receivers.push_back(std::make_unique<KbTickerHttpReceiver>(ipaddr, PORT, path));
        cout << "Ticker receiver added. ticker_receivers.size() = " << ticker_receivers.size() << "\n";
    }

};
