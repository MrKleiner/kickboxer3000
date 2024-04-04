#include <algorithm>
#include <vector>
#include <iostream>
#include <sstream>

#pragma comment(lib,"ws2_32.lib") 
#pragma warning(disable:4996) // disable warning/error for obsolete inet_addr function
#include <winsock2.h>

#include "Stringer.h"
#include "KbUdpPacketHeaders.h"
#include <inttypes.h>


using namespace std;

string SERVER = "127.0.0.1";  // or "localhost" - ip address of UDP server
uint16_t PORT      =  8888;     // the port on which to listen for incoming data



WSADATA wsa_data;



class UDPClient {

private:
    SOCKET client_socket;
    sockaddr_in server;


public:
    
    UDPClient() {
        // create socket
        if ((client_socket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)) == SOCKET_ERROR) {
            printf("socket() failed with error code: %d", WSAGetLastError());
            exit(EXIT_FAILURE);
        }

        // Set timeout for recvfrom()
        DWORD recvfrom_timeout = 1 * 2000;
        setsockopt(client_socket, SOL_SOCKET, SO_RCVTIMEO, (const char*) &recvfrom_timeout, sizeof(recvfrom_timeout));

        // setup address structure
        memset((char*)&server, 0, sizeof(server));
        server.sin_family = AF_INET;
        server.sin_port = htons(PORT);
        server.sin_addr.S_un.S_addr = inet_addr(SERVER.data());
    }

    ~UDPClient() {
        closesocket(client_socket);
        WSACleanup();
    }

    UDPmessageStruct sendUDPmessage(const char * message, int message_len) {
        UDPmessageStruct server_answer_buf{};
        if (sendto(client_socket, message, message_len, 0, (sockaddr*)&server, sizeof(sockaddr_in)) == SOCKET_ERROR) {
            printf("sendto() failed with error code: %d", WSAGetLastError());
            exit(EXIT_FAILURE);
        }

        // try to receive some data, this is a blocking call
        int slen = sizeof(sockaddr_in);
        // int server_answer_buf_length;
        // char server_answer_buf[kbBUFLEN];
        if ((server_answer_buf.message_len = recvfrom(client_socket, server_answer_buf.message, kbBUFLEN, 0, (sockaddr*)&server, &slen)) == SOCKET_ERROR) {
            printf("recvfrom() failed with error code: %d", WSAGetLastError());
            //exit(EXIT_FAILURE);
            return server_answer_buf;
        }
        
        return server_answer_buf;
    }


    void startCommunication() {
        while (true) {
            char message[kbBUFLEN];
            std::string s;
            printf("\n\nEnter message: ");
            cin.getline(message, kbBUFLEN);
            if (strlen(message) > 0) {
                s = message; // char[] -> String
                s = Stringer::singleWhitespaces(Stringer::ltrimRtrim(s)); // ltrim + rtrim and singleWhitespaces inside
                switch (message[0]) {
                    case '0': zeroHandler(s);  break;
                    case '1': startTicker(s);  break;
                    case '2': pauseTicker(s);  break;
                    case '3': resumeTicker(s); break;
                    case '4': stopTicker(s);   break;
                    case '5': addTickerHttpReceiver(s);  break;
                    case '6': getTickerCurrentStatus(s); break;
                    case '7': addTickerUdpReceiver(s);   break;
                    case '8': addTickerEndTimeUdpReceiver(s); break;
                    case '9': getSystemStatus(s); break;
                    default : zeroHandler(s);  break;
                }
            }
            else {
                cout << "zero length message\n";
                continue;
            }
        }
    }


    void zeroHandler(std::string s) {
        printf("Command '%c' not implemented yet (reserverd for future using?)\n\n", s[0]);
    }


    void startTicker(std::string s) {
        cout << "Start timer request\n";
        StartTimerRequestUdpPacketHeader request_pkt_hdr;
        std::vector<std::string> tokens = splitToVector(s);
        if (tokens.size() != StartTimerRequestUdpPacketHeaderSignificantFieldsCount) {
            printf("Wrong number of arguments for startTimer. Expected: %d. Founded: %zu.\n", StartTimerRequestUdpPacketHeaderSignificantFieldsCount, tokens.size());
        }
        else {
            request_pkt_hdr.command       = strToChar(tokens[0]);
            request_pkt_hdr.timer_no      = strToChar(tokens[1]);
            request_pkt_hdr.start_minutes = strToChar(tokens[2]);
            request_pkt_hdr.start_seconds = strToChar(tokens[3]);
            request_pkt_hdr.end_minutes   = strToChar(tokens[4]);
            request_pkt_hdr.end_seconds   = strToChar(tokens[5]);
            UDPmessageStruct server_resnonse = sendUDPmessage((char*)&request_pkt_hdr, sizeof(request_pkt_hdr));
            if (server_resnonse.message_len > 0) 
            {
                string s = Stringer::charBufToCharCodes(server_resnonse.message, server_resnonse.message_len, false);
                printf("\nServer response for startTimer() request: %s\n\n\n", s.data());
            } else 
            {
                cout << "\nServer responded with zero length message\n\n\n";
            }
        }        
        // message = (char*)&startTimerPacketHeader;  // [kbBUFLEN]
        // char message[kbBUFLEN];
        // memcpy_s(message, sizeof(message), &startTimerUdpPacketHeader, sizeof(startTimerUdpPacketHeader));
    }

    void pauseTicker(string s) {
        cout << "Pause ticker request\n";
        PauseTickerRequestUdpPacketHeader request_pkt_hdr;
        std::vector<std::string> tokens = splitToVector(s);
        if (tokens.size() != PauseTickerRequestUdpPacketHeaderSignificantFieldsCount) {
            printf("Wrong number of arguments for pauseTicker. Expected: %d. Founded: %zu.\n", PauseTickerRequestUdpPacketHeaderSignificantFieldsCount, tokens.size());
        }
        else {
            request_pkt_hdr.command = strToChar(tokens[0]);
            request_pkt_hdr.timer_no = strToChar(tokens[1]);
        }
        UDPmessageStruct server_response_buf;
        server_response_buf = sendUDPmessage((char*)&request_pkt_hdr, sizeof(request_pkt_hdr));
        if (server_response_buf.message_len > 0) {
            string s = Stringer::charBufToCharCodes(server_response_buf.message, server_response_buf.message_len, false);
            printf("\nServer response for pauseTicker() request: %s\n\n\n", s.data());
        }
        else {
            cout << "\nServer responded with zero length message\n\n\n";
        }
    }


    void resumeTicker(string s) {
        cout << "Resume ticker request\n";
        ResumeTickerRequestUdpPacketHeader request_pkt_hdr;
        std::vector<std::string> tokens = splitToVector(s);
        if (tokens.size() != ResumeTickerRequestUdpPacketHeaderSignificantFieldsCount) {
            printf("Wrong number of arguments for resumeTicker. Expected: %d. Founded: %zu.\n", ResumeTickerRequestUdpPacketHeaderSignificantFieldsCount, tokens.size());
        }
        else {
            request_pkt_hdr.command = strToChar(tokens[0]);
            request_pkt_hdr.timer_no = strToChar(tokens[1]);
        }
        UDPmessageStruct server_response_buf;
        server_response_buf = sendUDPmessage((char*)&request_pkt_hdr, sizeof(request_pkt_hdr));
        if (server_response_buf.message_len > 0) {
            string s = Stringer::charBufToCharCodes(server_response_buf.message, server_response_buf.message_len, false);
            printf("\nServer response for resumeTicker() request: %s\n\n\n", s.data());
        }
        else {
            cout << "\nServer responded with zero length message\n\n\n";
        }
    }

    void stopTicker(string s) {
        cout << "Stop ticker request\n";
        StopTickerRequestUdpPacketHeader request_pkt_hdr;
        std::vector<std::string> tokens = splitToVector(s);
        if (tokens.size() != StopTickerRequestUdpPacketHeaderSignificantFieldsCount) {
            printf("Wrong number of arguments for pauseTicker. Expected: %d. Founded: %zu.\n", StopTickerRequestUdpPacketHeaderSignificantFieldsCount, tokens.size());
        }
        else {
            request_pkt_hdr.command = strToChar(tokens[0]);
            request_pkt_hdr.timer_no = strToChar(tokens[1]);
        }
        UDPmessageStruct server_response_buf;
        server_response_buf = sendUDPmessage((char*)&request_pkt_hdr, sizeof(request_pkt_hdr));
        if (server_response_buf.message_len > 0) {
            string s = Stringer::charBufToCharCodes(server_response_buf.message, server_response_buf.message_len, false);
            printf("\nServer response for stopTicker() request: %s\n\n\n", s.data());
        }
        else {
            cout << "\nServer responded with zero length message\n\n\n";
        }
    }

    void getTickerCurrentStatus(string s) {
        cout << "Get Ticker Current Status\n";
        GetTimerRequestUdpPacketHeader request_pkt_hdr;
        vector<string> tokens = splitToVector(s);
        if (tokens.size() != GetTimerRequestUdpPacketHeaderSignificantFieldsCount) {
            printf("Wrong number of arguments for getTimer. Expected: %d. Founded: %zu.\n", GetTimerRequestUdpPacketHeaderSignificantFieldsCount, tokens.size());
        }
        else {
            request_pkt_hdr.command  = strToChar(tokens[0]);
            request_pkt_hdr.timer_no = strToChar(tokens[1]);
            UDPmessageStruct server_response_buf;
            // no variable lenght params in this request. So, request header is a full request message
            server_response_buf = sendUDPmessage((char*)&request_pkt_hdr, sizeof(request_pkt_hdr));
            if (server_response_buf.message_len > 0) {
                string s = Stringer::charBufToCharCodes(server_response_buf.message, server_response_buf.message_len, false);
                printf("\nServer response for getTickerCurrentStatus() request: %s\n\n\n", s.data());
            } else {
                cout << "\nServer responded with zero length message\n\n\n";
            }
        }
    }


    void addTickerUdpReceiver(string s) {
        cout << "Subscribe to timer request\n";
        AddTimerUdpReceiverRequestUdpPacketHeader request_pkt_hdr;
        vector<std::string> tokens = splitToVector(s);
        if ( tokens.size() != AddTimerUdpReceiverRequestUdpPacketHeaderSignificantFieldsCount + 3 ) {
            printf("Wrong number of arguments for subscribe to timer . Expected: %d. Founded: %zu.\n", AddTimerUdpReceiverRequestUdpPacketHeaderSignificantFieldsCount, tokens.size());
        } else {
            request_pkt_hdr.command      = strToChar(tokens[0]);
            request_pkt_hdr.timer_no     = strToChar(tokens[1]);
            request_pkt_hdr.ipv4_addr[0] = strToChar(tokens[2]);
            request_pkt_hdr.ipv4_addr[1] = strToChar(tokens[3]);
            request_pkt_hdr.ipv4_addr[2] = strToChar(tokens[4]);
            request_pkt_hdr.ipv4_addr[3] = strToChar(tokens[5]);
            request_pkt_hdr.udp_port     = stoi(tokens[6]);

            UDPmessageStruct server_response_buf;
            // no variable lenght params in this request. So, request header is a full request message
            server_response_buf = sendUDPmessage((char*)&request_pkt_hdr, sizeof(request_pkt_hdr));
            if (server_response_buf.message_len > 0)
                cout << "\nServer response: " << Stringer::charBufToCharCodes(server_response_buf.message, server_response_buf.message_len) << "\n\n\n";
            else
                cout << "\nServer responded with zero length message\n\n\n";
        }
    }


    void addTickerEndTimeUdpReceiver(string s) {
        cout << "Subscribe to End Time ticker event\n";
        AddTimerUdpReceiverRequestUdpPacketHeader request_pkt_hdr;
        vector<std::string> tokens = splitToVector(s);
        if (tokens.size() != AddTimerUdpReceiverRequestUdpPacketHeaderSignificantFieldsCount + 3) {
            printf("Wrong number of arguments for subscribe to timer . Expected: %d. Founded: %zu.\n", AddTimerUdpReceiverRequestUdpPacketHeaderSignificantFieldsCount, tokens.size());
        }
        else {
            request_pkt_hdr.command = strToChar(tokens[0]);
            request_pkt_hdr.timer_no = strToChar(tokens[1]);
            request_pkt_hdr.ipv4_addr[0] = strToChar(tokens[2]);
            request_pkt_hdr.ipv4_addr[1] = strToChar(tokens[3]);
            request_pkt_hdr.ipv4_addr[2] = strToChar(tokens[4]);
            request_pkt_hdr.ipv4_addr[3] = strToChar(tokens[5]);
            request_pkt_hdr.udp_port = stoi(tokens[6]);

            UDPmessageStruct server_response_buf;
            // no variable lenght params in this request. So, request header is a full request message
            server_response_buf = sendUDPmessage((char*)&request_pkt_hdr, sizeof(request_pkt_hdr));
            if (server_response_buf.message_len > 0)
                cout << "\nServer response: " << Stringer::charBufToCharCodes(server_response_buf.message, server_response_buf.message_len) << "\n\n\n";
            else
                cout << "\nServer responded with zero length message\n\n\n";
        }
    }






    void addTickerHttpReceiver(std::string s) {
        cout << "Add timer http receiver request\n";
        AddTimerHttpReceiverRequestUdpPacketHeader request_pkt_hdr;
        std::vector<std::string> tokens = splitToVector(s);
        if (tokens.size() != AddTimerHttpReceiverRequestUdpPacketHeaderSignificantFieldsCount + 3) {
            printf("Wrong number of arguments for subscribe to timer . Expected: %d. Founded: %zu.\n", AddTimerUdpReceiverRequestUdpPacketHeaderSignificantFieldsCount, tokens.size());
        }
        else {
            request_pkt_hdr.fixed_part = {
                .command = strToChar(tokens[0]),
                .timer_no = strToChar(tokens[1]),
                .ipv4_addr = {strToChar(tokens[2]), strToChar(tokens[3]), strToChar(tokens[4]), strToChar(tokens[5])},
                .tcp_port = (uint16_t)stoi(tokens[6])
            };
            strcpy(request_pkt_hdr.path, tokens[7].c_str()); // String -> char[]
            int csize = strlen(request_pkt_hdr.path);
            UDPmessageStruct server_response_buf;
            server_response_buf = sendUDPmessage((char *)&request_pkt_hdr, sizeof(request_pkt_hdr.fixed_part)+csize);
            if (server_response_buf.message_len > 0)
                cout << "\nServer response: " << Stringer::charBufToCharCodes(server_response_buf.message, server_response_buf.message_len) << "\n\n\n";
            else
                cout << "\nServer responded with zero length message\n\n\n";
        }


    }



    void getSystemStatus(std::string s) {
        cout << "Check service status\n";
        GetSystemStatusUdpPacketHeader request_pkt_hdr;
        UDPmessageStruct server_response_buf;
        server_response_buf = sendUDPmessage((char*)&request_pkt_hdr, sizeof(request_pkt_hdr) );
        if (server_response_buf.message_len > 0)
            cout << "\nServer response: " << Stringer::charBufToCharCodes(server_response_buf.message, server_response_buf.message_len, false) << "\n\n\n";
        else
            cout << "\nServer responded with zero length message\n\n\n";
    
    }

    /**
       @brief Wrapper for stoi() with exception processing.
       @param s : string to convert
       @return stoi() result or undefined if error
    */
    uint8_t strToChar(string s) {
        try { return stoi(s); } catch (...) { printf("!!!!\n!!!! Token error !!!!\n!!!! (%s)\n!!!!\n\n", s.data()); return 0; } 
    }

    // Split string to vector by space
    std::vector<std::string> splitToVector(std::string s) {
        char split_char(0x20);
        std::istringstream split(s.data());
        std::vector<std::string> tokens;
        for (std::string each; std::getline(split, each, split_char); tokens.push_back(each));
        printf("Vector size: %I64u\n\n", tokens.size());
        for (auto& s : tokens)
            printf("Parsed incoming data: '%s'\n", s.data());
        return tokens;
    }


};

int main(int argc, char* argv[]) {
    system("title ===  UDP Client  ===  Build date:  " __DATE__ "  ===  Build time : " __TIME__ "  ==="); // cmd console window title
    cout << "UDP sender.\n\n";
    if (argc != 3) {
        cout << "Usage                     :  kbUDPclient ipaddress port\n";
        cout << "Example                   :  kbUDPclient 127.0.0.1 8888\n";
        cout << "Without params (defaults) :  kbUDPclient 127.0.0.1 8888\n\n";
    }
    else {
        SERVER = argv[1];
        uint16_t argv_port;
        try { 
            argv_port = stoi(argv[2]);
            PORT = argv_port;
        }
        catch (...) { 
            cout << "Wrong port number. Exiting...\n"; return 0;
        }
    }
    cout << "ip address to use :   " << SERVER << "\n";
    cout << "UDP port to use   :   " << PORT << "\n\n";


    // initialise winsock2
    printf("Initialising Winsock2... ");
    if (WSAStartup(MAKEWORD(2, 2), &wsa_data) != 0) {
        printf("Failed. Error Code: %d", WSAGetLastError());
        exit(EXIT_FAILURE);
    }
    printf("Initialised.\n");



    UDPClient udpClient;
    udpClient.startCommunication();

    WSACleanup();
}